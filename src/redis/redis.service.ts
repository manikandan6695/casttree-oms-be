import { Injectable, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PaymentRequestService } from 'src/payment/payment-request.service';
import { ECoinStatus, ERedisEventType } from 'src/payment/enum/payment.enum';
import { EventOutBoxService } from '../event-outbox/event-outbox.service';
import { IEventOutBox } from 'src/event-outbox/schema/event-outbox.schema';
const { ObjectId } = require("mongodb");

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: RedisClientType;
  private subscriberClient: RedisClientType;
  private isConnected = false;
  private isPolling = false;

  @InjectModel('eventOutBox')
  private eventOutBoxModel: Model<IEventOutBox>;

  constructor(
    @Inject(forwardRef(() => PaymentRequestService))
    private paymentRequestService: PaymentRequestService,
    private eventOutBoxService: EventOutBoxService,
  ) { }

  async initRedisClients() {
    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        connectTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT),
        timeout: parseInt(process.env.REDIS_TIMEOUT),
        tls: true,
        rejectUnauthorized: false,
      }
    });

    this.subscriberClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        connectTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT),
        timeout: parseInt(process.env.REDIS_TIMEOUT),
        tls: true,
        rejectUnauthorized: false,
      }
    });

    await this.client.connect();
    await this.subscriberClient.connect();
    this.isConnected = true;
    console.log("✅ Redis clients connected");
  }

  public async startPolling() {
    if (!this.isConnected) {
      await this.initRedisClients();
    }
    if (!this.isPolling) {
      this.isPolling = true;
      this.startQueuePolling();
    }
  }

  private async startQueuePolling() {
    while (this.isPolling) {
      try {
        const result = await this.subscriberClient.blPop(ERedisEventType.coinPurchase, 1);
        // console.log("result", result);
        if (result) {
          await this.eventOutBoxService.updateEventOutBox(result);
          await this.paymentRequestService.handleCoinPurchaseFromRedis(result);
        }
      } catch (error) {
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  }

  async publishCoinPurchaseResponse(data: any) {
    try {
      await this.client.publish(ERedisEventType.coinPurchaseResponse, JSON.stringify(data));
    } catch (error) {
      throw error;
    }
  }

  async pushToCoinPurchaseQueue(data: any, queueName: string = ERedisEventType.coinPurchase, orderId: any, sourceId: string) {
    try {
      const payload = {
        userId: data?.userId,
        eventName: data?.eventName,
        payload: data?.payload,
        status: ECoinStatus.active,
        documentStatus: ECoinStatus.pending,
        triggeredAt: new Date(),
        sourceId: data?.sourceId,
        sourceType: data?.sourceType,
        consumer: data?.consumer,
      };

      const createEvent = await this.eventOutBoxService.createEventOutBox(payload);
      const queuePayload = {
        orderId,
        eventOutBoxId: createEvent?._id,
      };
      console.log("event", `${queueName}:${sourceId}`)
      await this.client.lPush(`${queueName}:${sourceId}`, JSON.stringify(queuePayload));
    } catch (error) {
      throw error;
    }
  }

  async pushToIntermediateTransferQueue(data: any, orderId: any, sourceId: string) {
    return this.pushToCoinPurchaseQueue(data, ERedisEventType.intermediateTransfer, orderId, sourceId);
  }

  async onModuleDestroy() {
    this.isPolling = false;
    if (this.isConnected) {
      await this.client.quit();
      await this.subscriberClient.quit();
    }
  }
}
