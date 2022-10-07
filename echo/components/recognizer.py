import os
import subprocess
from dataclasses import dataclass
from datetime import datetime

import torch
import whisper
from lightning import BuildConfig, CloudCompute, LightningWork
from lightning_app.storage import Drive
from lightning_app.utilities.app_helpers import Logger

from echo.components.database.client import DatabaseClient
from echo.media.video import contains_audio
from echo.models.echo import Echo, Segment

DEFAULT_MODEL_SIZE = "base"

DUMMY_ECHO_ID = "dummy"

logger = Logger(__name__)


@dataclass
class CustomBuildConfig(BuildConfig):
    def build_commands(self):
        return ["sudo apt-get update", "sudo apt-get install -y ffmpeg"]


class SpeechRecognizer(LightningWork):
    def __init__(
        self,
        model_size=DEFAULT_MODEL_SIZE,
        drive: Drive = None,
    ):
        super().__init__(
            parallel=True,
            cloud_compute=CloudCompute("gpu"),
            cloud_build_config=CustomBuildConfig(
                requirements=[
                    "torch",
                    "whisper@ git+https://github.com/openai/whisper",
                ]
            ),
        )

        # NOTE: Private attributes don't need to be serializable, so we use them to store complex objects
        self._drive = drive
        self._model = None

        self.model_size = model_size

    def recognize(self, audio_file_path: str):
        assert os.path.exists(audio_file_path), f"File does not exist: {audio_file_path}"

        return self._model.transcribe(audio_file_path, fp16=torch.cuda.is_available())

    def convert_to_audio(self, echo_id: str, video_file_path: str):
        if not contains_audio(video_file_path):
            raise ValueError(f"Video does not contain an audio stream: {video_file_path}")

        extracted_audio_file_path = f"{echo_id}-extracted.mp3"
        # TODO(alecmerdler): Figure out how to use `ffmpeg-python` rather than shelling out...
        # TODO(alecmerdler): Handle exceptions from `ffmpeg` (no audio stream, etc)...
        subprocess.call(f"ffmpeg -i {video_file_path} -vn -acodec libmp3lame {extracted_audio_file_path}", shell=True)

        return extracted_audio_file_path

    def run(self, echo: Echo, db_url: str):
        """Runs speech recognition and returns the text for a given Echo."""
        # Load model lazily at runtime, rather than in `__init__()`
        if self._model is None:
            self._model = whisper.load_model(self.model_size)

        logger.info("Initializing database client")
        echo_db_client = DatabaseClient(model=Echo, db_url=db_url)
        segment_db_client = DatabaseClient(model=Segment, db_url=db_url)

        # NOTE: Dummy Echo is used to spin up the cloud machine on app startup so subsequent requests are faster
        if echo.id == DUMMY_ECHO_ID:
            logger.info("Skipping dummy Echo")
            return

        logger.info(f"Recognizing speech from: {echo.id}")

        audio_file_path = echo.source_file_path
        self._drive.get(echo.source_file_path)

        if echo.media_type.split("/")[0] == "video":
            audio_file_path = self.convert_to_audio(echo.id, echo.source_file_path)

        # Run the speech recognition model and save the result
        result = self.recognize(audio_file_path)

        # FIXME(alecmerdler): It would be better separation of concerns to not use the DB client in this component...
        echo.completed_transcription_at = datetime.now()
        echo.text = result["text"]
        echo_db_client.put(echo)

        # FIXME(alecmerdler): Hopefully this doesn't make SQLite fall over...
        for segment in result["segments"]:
            segment_db_client.post(
                Segment(
                    id=f"{echo.id}-{segment['id']}",
                    echo_id=echo.id,
                    text=segment["text"],
                    seek=segment["seek"],
                    start=segment["start"],
                    end=segment["end"],
                )
            )

        logger.info(f"Finished recognizing speech from: {echo.id}")

        os.remove(audio_file_path)
