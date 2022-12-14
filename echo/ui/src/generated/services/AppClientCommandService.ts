/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type { BaseHttpRequest } from "../core/BaseHttpRequest";
import type { CancelablePromise } from "../core/CancelablePromise";
import type { DeleteEchoConfig } from "../models/DeleteEchoConfig";
import type { Echo } from "../models/Echo";
import type { GetEchoConfig } from "../models/GetEchoConfig";
import type { ListEchoesConfig } from "../models/ListEchoesConfig";

export class AppClientCommandService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Create Echo
   * @param requestBody
   * @returns any Successful Response
   * @throws ApiError
   */
  public createEchoCommandCreateEchoPost(requestBody: Echo): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "POST",
      url: "/command/create_echo",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * List Echoes
   * @param requestBody
   * @returns any Successful Response
   * @throws ApiError
   */
  public listEchoesCommandListEchoesPost(requestBody: ListEchoesConfig): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "POST",
      url: "/command/list_echoes",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Get Echo
   * @param requestBody
   * @returns any Successful Response
   * @throws ApiError
   */
  public getEchoCommandGetEchoPost(requestBody: GetEchoConfig): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "POST",
      url: "/command/get_echo",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Delete Echo
   * @param requestBody
   * @returns any Successful Response
   * @throws ApiError
   */
  public deleteEchoCommandDeleteEchoPost(requestBody: DeleteEchoConfig): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "POST",
      url: "/command/delete_echo",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Login
   * @returns any Successful Response
   * @throws ApiError
   */
  public loginCommandLoginPost(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "POST",
      url: "/command/login",
    });
  }
}
