import { HttpService } from "@nestjs/axios";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  IPeertubeRepository,
  RunnerJobDTO,
} from "../interface/ipeertube.repository";
import { IPeertubeLoginResponse } from "./interface/login.response";
import { DataResponse } from "./interface/runner-job.response";
import { PeertubeVideoResponse } from "./interface/video-detail.response";
const qs = require("qs");

@Injectable()
export class PeertubeRepository implements IPeertubeRepository {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
    private http_service: HttpService
  ) {}

  async getRunnerJob(data: RunnerJobDTO): Promise<DataResponse> {
    const tokenRes: IPeertubeLoginResponse = await this.getPeertubeToken(
      this.configService.get("PEERTUBE_USERNAME"),
      this.configService.get("PEERTUBE_PASSWORD")
    );
    let response = await this.http_service
      .get(
        `${this.configService.get("PEERTUBE_BASE_URL")}/api/v1/runners/jobs`,
        {
          headers: {
            Authorization: `Bearer ${tokenRes.access_token}`,
          },
          params: {
            start: data.start,
            count: data.limit,
            sort: data.sort || "",
            stateOneOf: data.stateOneOf,
          },
        }
      )
      .toPromise();
    return response.data;
  }

  async getPeertubeToken(
    username: string,
    password: string
  ): Promise<IPeertubeLoginResponse> {
    try {
      const cacheKey = `peertubeToken${username}${password}`;
      const data =
        await this.cacheManager.get<IPeertubeLoginResponse>(cacheKey);
      if (data) return data;
      let requestBody = {
        client_id: this.configService.get("PEERTUBE_CLIENT_ID"),
        client_secret: this.configService.get("PEERTUBE_CLIENT_SECRET"),
        grant_type: "password",
        username,
        password,
      };
      let fv = qs.stringify(requestBody);
      let loginRes = await this.http_service
        .post(
          `${this.configService.get("PEERTUBE_BASE_URL")}/api/v1/users/token`,
          fv,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        )
        .toPromise();
      const loginResData: IPeertubeLoginResponse = loginRes.data;
      await this.cacheManager.set(
        cacheKey,
        loginResData,
        loginResData.expires_in * 1000
      );
      return loginResData;
    } catch (err) {
      throw err;
    }
  }

  async getVideoDetail(videoId: string) {
    try {
      if (!videoId) throw new Error("Invalid project Id");
      const tokenRes: IPeertubeLoginResponse = await this.getPeertubeToken(
        this.configService.get("PEERTUBE_USERNAME"),
        this.configService.get("PEERTUBE_PASSWORD")
      );
      // console.log("tokenRes", tokenRes.access_token);
      // console.log(
      //   "peertube base url is",
      //   this.configService.get("PEERTUBE_BASE_URL")
      // );

      let response = await this.http_service
        .get(
          `${this.configService.get("PEERTUBE_BASE_URL")}/api/v1/videos/${videoId}`,
          {
            headers: {
              Authorization: `Bearer ${tokenRes.access_token}`,
            },
          }
        )
        .toPromise();
   //   console.log("response is", response);

      return response.data;
    } catch (err) {
      throw err;
    }
  }

  async getVideoURLByEmbeddedURL(embeddedURL: string): Promise<string> {
    try {
   //   console.log("embeddedURL is", embeddedURL);

      if (!embeddedURL.includes(this.configService.get("PEERTUBE_BASE_URL"))) {
    //    console.log("inside not a valid video");
        throw new Error("Not a valid video");
      }
      const videoId = embeddedURL.split("/").pop();
  //    console.log("videoId", videoId);

      let videoDetail: PeertubeVideoResponse =
        await this.getVideoDetail(videoId);
 //     console.log("videoDetail", videoDetail);

      if (videoDetail.streamingPlaylists.length) {
    //    console.log("inside streaming play list");

        return videoDetail.streamingPlaylists[0].playlistUrl;
      }
      if (videoDetail.files.length) {
    //    console.log("inside files");
        return videoDetail.files[0].fileUrl;
      }
      return "";
    } catch (err) {
      throw err;
    }
  }
}
