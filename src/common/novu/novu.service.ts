import { BadRequestException, Injectable } from "@nestjs/common";
import { NestVaultService } from "../nest-vault/nest-vault.service";
import {
  NovuCredentialsDto,
  SdkTriggerDTO,
  novuUserCreateOrUpdateDTO,
} from "./dto/novu.dto";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { IBulkEvents, Novu } from "@novu/node";
import { KISAN } from "./workflow.constants";

@Injectable()
export class NovuService {
  private apiKey: string;
  private novuBaseUrl: string;
  private novu: Novu;
  constructor(
    private readonly nestVaultService: NestVaultService,
    private readonly httpService: HttpService
  ) {
    this.apiKey = this.nestVaultService.get("NOVUAPIKEY");
    this.novuBaseUrl = this.nestVaultService.get("NOVUBASEURL");
    this.novu = new Novu(this.apiKey, {
      backendUrl: `${this.novuBaseUrl}`,
    });
  }

  async createSubscriber(body: novuUserCreateOrUpdateDTO) {
    try {
      console.log("Novu subscriber creating ==>", body.subscriberId);

      const response = await this.novu.subscribers.identify(body.subscriberId, {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        avatar: body.avatar,
        locale: body.locale,
        data: body.data,
      });

      console.log(
        "Novu subscriber successfully created ==>",
        body.subscriberId
      );
      return response?.data?.data;
    } catch (err) {
      console.error(
        "Error: createSubscriber",
        err?.response ? err?.response?.data : err.message
      );
    }
  }

  async getUser(subscriberId: string) {
    try {
      console.log("Fetching Novu subscriber ==>", subscriberId);
      const response = await this.novu.subscribers.get(subscriberId);
      return response?.data?.data;
    } catch (err) {
      console.error(
        "Error: Novu getUser",
        err.response ? err.response.data : err.message
      );
    }
  }

  async updateUser(body: novuUserCreateOrUpdateDTO) {
    const updateSubscriberRequest = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
    };

    try {
      console.log("Updating Novu subscriber ==>", body.subscriberId);
      const response = await this.novu.subscribers.update(
        body.subscriberId,
        updateSubscriberRequest
      );
      console.log(
        "Novu subscriber successfully updated ==>",
        body.subscriberId
      );
      return response?.data?.data;
    } catch (error) {
      console.error(
        "Error: Novu update user",
        error.response ? error.response.data : error.message
      );
    }
  }

  async deleteSubscriber(subscriberId: string) {
    try {
      console.log("Deleting Novu subscriber ==>", subscriberId);
      const response = await this.novu.subscribers.delete(subscriberId);
      console.log("Novu subscriber successfully deleted ==>", subscriberId);
      return response?.data?.data;
    } catch (error) {
      console.error(
        "Error: Novu deleteSubscriber",
        error?.response ? error?.response?.data : error?.message
      );
    }
  }

  async notificationSdkTrigger(body: SdkTriggerDTO): Promise<string> {
    try {
      const MAX_LIMIT = 1000;
      if (!body.subscriberIds || body.subscriberIds.length === 0) {
        return "No subscribers to notify";
      }
      if (body.subscriberIds.length > MAX_LIMIT) {
        throw new BadRequestException(
          `Subscriber list exceeds the maximum limit of ${MAX_LIMIT}`
        );
      }

      const payloadVals = {
        notifee: {
          title: body?.payload?.title,
          body: body?.payload?.body,
          data: body.payload?.data,
          android: {
            channelId: "default",
            actions: body.payload?.actions || [
              {
                title: "Mark as Read",
                pressAction: {
                  id: "read",
                },
              },
            ],
            // pressAction: { id: "default", launchActivity: "default" },
          },
        },
      };
      if (body?.payload?.imageUrl) {
        payloadVals["notifee"]["android"]["style"] = {
          type: 0,
          picture: body?.payload?.imageUrl,
        };
      }
      const payload: IBulkEvents[] = body.subscriberIds.map((subscriberId) => ({
        name: this.nestVaultService.get("NOVO_ORGNAIZATION_NAME") || KISAN,
        to: {
          subscriberId: subscriberId,
        },
        payload: payloadVals,
        overrides: body.overrides,
        tenant: {
          identifier:
            body.toolId || this.nestVaultService.get<string>("TOOLID"),
        },
      }));

      console.log(
        "Notification json payload from campaign payloadVals => ",
        JSON.stringify(payloadVals)
      );
      console.log(
        "Notification json payload from campaign payload => ",
        JSON.stringify(payload?.[0])
      );

      const CHUNK_SIZE = 100;
      const chunks = [];
      for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
        chunks.push(payload.slice(i, i + CHUNK_SIZE));
      }

      const processChunk = async (chunk: IBulkEvents[]) => {
        try {
          await this.novu.bulkTrigger(chunk);
          console.log(
            `Bulk trigger chunk processed successfully`,
            chunk.length
          );
        } catch (error) {
          console.error("Error sending chunk:", error);
        }
      };

      await Promise.all(chunks.map(processChunk));

      return "Notifications sent successfully";
    } catch (err) {
      throw err;
    }
  }

  async setNovuCredentials(credentials: NovuCredentialsDto): Promise<any> {
    try {
      console.log(
        "NOVU: Checking existing credentials for subscriber:",
        credentials.subscriberId
      );

      const existingSubscriber = await this.novu.subscribers.get(
        credentials.subscriberId
      );
      const subscriber = existingSubscriber?.data?.data;

      let existingTokens: string[] = [];
      if (subscriber?.channels?.length) {
        subscriber?.channels?.forEach((channel) => {
          if (
            channel.providerId === credentials.providerId &&
            channel.credentials?.deviceTokens?.length
          ) {
            existingTokens = channel.credentials.deviceTokens;
          }
        });

        console.log(
          `NOVU: Existing Tokens for provider ${credentials.providerId}:`,
          existingTokens
        );
      }

      const newToken = credentials.credentials.deviceTokens?.[0];
      if (newToken && existingTokens.includes(newToken)) {
        console.log("NOVU: Token already exists. Skipping update.");
        return existingSubscriber;
      }

      console.log(
        "NOVU: Setting new credentials for subscriber:",
        credentials.subscriberId
      );

      const data = await this.setSubscriberCredentials({
        subscriberId: credentials.subscriberId,
        providerId: credentials.providerId,
        credentials: credentials.credentials,
        integrationIdentifier: credentials.integrationIdentifier,
      });

      console.log(
        "NOVU: Successfully updated credentials:",
        JSON.stringify(data?.data, null, 2)
      );

      return data;
    } catch (err) {
      console.error("NOVU Unable to set credentials for subscriber =>", err);
    }

    return undefined;
  }
  async setSubscriberCredentials(credentials: {
    subscriberId: string;
    providerId: string;
    credentials: any;
    integrationIdentifier: string;
  }) {
    const url = `${this.novuBaseUrl}/v1/subscribers/${credentials.subscriberId}/credentials`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `ApiKey ${this.apiKey}`,
    };
    try {
      const response = await firstValueFrom(
        this.httpService.put(url, credentials, { headers })
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error setting subscriber credentials:",
        error.response?.data || error.message
      );
    }
  }
}
