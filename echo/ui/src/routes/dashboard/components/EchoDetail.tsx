import { useCallback, useEffect, useState } from "react";

import DownloadIcon from "@mui/icons-material/Download";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { Breadcrumbs, CircularProgress, Link, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { echoGalleryURL } from "links";

import useDownloadEchoSubtitles from "hooks/useDownloadEchoSubtitles";
import useDownloadEchoText from "hooks/useDownloadEchoText";
import useGetEcho from "hooks/useGetEcho";
import { useLightningState } from "hooks/useLightningState";
import { Button } from "lightning-ui/src/design-system/components";
import { SupportedMediaType, isVideo } from "utils";

import AudioPreview from "./AudioPreview";
import Subtitles from "./Subtitles";
import VideoPreview from "./VideoPreview";

type Props = {
  echoID?: string;
  goBack: () => void;
};

export default function EchoDetail({ echoID, goBack }: Props) {
  const lightningState = useLightningState();
  const downloadEcho = useDownloadEchoText();
  const downloadSubtitles = useDownloadEchoSubtitles();

  const theme = useTheme();
  const onMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { data: echo, isLoading } = useGetEcho(echoID, true);

  const [playMediaFrom, setPlayMediaFrom] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);

  useEffect(() => {
    setCurrentSegment(0);
  }, [echoID]);

  const onCurrentTimeChange = useCallback(
    (currentTime: number) => {
      const segment = echo?.segments.find(segment => segment.start <= currentTime && segment.end >= currentTime);
      if (segment) {
        setCurrentSegment(Number(segment.id.split("-")[segment.id.split("-").length - 1]));
      }
    },
    [echo?.segments],
  );

  if (!echoID) {
    return (
      <Stack direction={"column"} alignItems={"center"} justifyContent={"center"} spacing={2} height={"100%"}>
        <GraphicEqIcon fontSize="large" />
        <Typography variant={"body2"}>Select an Echo to view details</Typography>
      </Stack>
    );
  }

  if (isLoading) {
    return (
      <Stack direction={"column"} justifyContent={"center"} alignItems={"center"} spacing={2} height={"100%"}>
        <CircularProgress />
        <Typography variant={"body2"}>Fetching Echo</Typography>
        {onMobile && (
          <Button variant={"text"} color={"primary"} onClick={() => goBack()}>
            Go Back
          </Button>
        )}
      </Stack>
    );
  }

  if (!echo || !echo.echo.completedTranscriptionAt) {
    return (
      <Stack direction={"column"} justifyContent={"center"} alignItems={"center"} spacing={2} height={"100%"}>
        <CircularProgress />
        <Typography variant={"body2"} textAlign={"center"}>
          Echo is processing, this can take up to a minute or two.
          <Link target={"_blank"} href={echoGalleryURL}>
            <Typography variant={"body2"}>Click here for faster processing speeds</Typography>
          </Link>
        </Typography>
        {onMobile && (
          <Button variant={"text"} color={"primary"} onClick={() => goBack()}>
            Go Back
          </Button>
        )}
      </Stack>
    );
  }

  const fileserverURL = lightningState?.works["fileserver"]["vars"]["_url"];
  const sourceFileURL = `${fileserverURL}/download/${echo.echo.id}`;

  const sourcePreview = isVideo(echo.echo.mediaType as SupportedMediaType) ? (
    <VideoPreview sourceFileURL={sourceFileURL} playFrom={playMediaFrom} onCurrentTimeChange={onCurrentTimeChange} />
  ) : (
    <AudioPreview sourceFileURL={sourceFileURL} playFrom={playMediaFrom} onCurrentTimeChange={onCurrentTimeChange} />
  );

  return (
    <Stack direction={"column"} height={"100%"}>
      <Stack padding={2} height={"10%"}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color={"primary"} sx={{ ":hover": { cursor: "pointer" } }} onClick={() => goBack()}>
            Echoes
          </Link>
          <Typography color="text.primary">{echo.echo.displayName ?? echo.echo.id}</Typography>
        </Breadcrumbs>
      </Stack>
      <Stack direction={"row"} justifyContent={"center"} height={"40%"}>
        {sourcePreview}
      </Stack>
      <Stack padding={2} height={"50%"}>
        <Stack direction={"row"} justifyContent={"space-between"} marginBottom={2}>
          <Typography variant={"h6"}>Captions</Typography>
          <Stack direction={"row"} spacing={2}>
            <Button
              aria-label={"Download Subtitles"}
              size={"small"}
              variant={"text"}
              icon={<DownloadIcon />}
              disabled={echo.segments.length === 0}
              onClick={() => downloadSubtitles(echo.echo, echo.segments)}
              text={"Subtitles"}
            />
            <Button
              aria-label={"Download Text"}
              size={"small"}
              variant={"text"}
              icon={<DownloadIcon />}
              disabled={echo.echo.text === ""}
              onClick={() => downloadEcho(echo.echo)}
              text={"Text"}
            />
          </Stack>
        </Stack>
        <Stack flexGrow={1} sx={{ overflowY: "scroll" }} maxHeight={"35vh"}>
          {echo?.segments && echo.segments.length > 0 && currentSegment >= 0 ? (
            <Subtitles segments={echo.segments} currentSegment={currentSegment} onSelectTimestamp={setPlayMediaFrom} />
          ) : (
            <Stack justifyContent={"center"} alignItems={"center"} paddingTop={2}>
              <Typography variant={"body2"}>No speech detected in content.</Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
