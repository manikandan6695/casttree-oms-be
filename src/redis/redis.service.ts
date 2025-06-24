import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ECoinStatus, ERedisEventType } from 'src/payment/enum/payment.enum';
import { PaymentRequestService } from 'src/payment/payment-request.service';
import { Model } from 'mongoose';
import { IEventOutBox } from './schema/eventOutBox';
import { InjectModel } from '@nestjs/mongoose';
const { ObjectId } = require("mongodb");


@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType;
    private subscriberClient: RedisClientType;
    private coinPurchaseCallback: (data: any) => void;
    private isConnected = false;
    private isPolling = false;
    @InjectModel('eventOutBox') private eventOutBoxModel: Model<IEventOutBox>;
    @Inject(forwardRef(() => PaymentRequestService))
    private paymentRequestService: PaymentRequestService;

    async onModuleInit() {
        try {
            this.client = createClient({
                url: 'redis://20.244.42.120:6379',
                socket: {
                    connectTimeout: 5000,
                    timeout: 5000
                }
            });
            await this.client.connect();
            // console.log("✅ Redis publisher connected");
            this.isConnected = true;

            this.subscriberClient = createClient({
                url: 'redis://20.244.42.120:6379',
                socket: {
                    connectTimeout: 5000,
                    timeout: 5000
                }
            });

            // this.subscriberClient.on('error', (err) => {
            //     console.error('❌ Redis subscriber client error:', err);
            // });

            await this.subscriberClient.connect();
            // console.log("✅ Redis subscriber connected");

            this.isPolling = true;
            this.startQueuePolling();

        } catch (error) {
            // console.error("❌ Failed to connect to Redis:", error.message);
            // console.log("⚠️  Application will continue without Redis functionality");
            this.isConnected = false;
        }
    }

    async onModuleDestroy() {
        this.isPolling = false;
        if (this.isConnected) {
            try {
                await this.client.quit();
                await this.subscriberClient.quit();
                // console.log("🔌 Redis connections closed");
            } catch (error) {
                console.error("Error closing Redis connections:", error);
            }
        }
    }
    async startQueuePolling() {
        while (this.isPolling) {
            try {
                const result = await this.subscriberClient.blPop(ERedisEventType.coinPurchase, 1);
                if (result) {
                    // console.log("BLPOP result:", result);
                    await this.updateEventOutBox(result);
                    await this.paymentRequestService.handleCoinPurchaseFromRedis(result);
                } else {
                    await new Promise(res => setTimeout(res, 500));
                }
            } catch (error) {
                // console.error("Error polling queue:", error);
                // Wait a bit before retrying in case of error
                await new Promise(res => setTimeout(res, 1000));
            }
        }
    }

    onCoinPurchase(callback: (data: any) => void) {
        this.coinPurchaseCallback = callback;
        if (!this.isConnected) {
            // console.log("⚠️  Redis not connected, coin purchase callback set but will not receive data");
        }
    }

    async publishCoinPurchaseResponse(data: any) {  
        try {
            await this.client.publish(ERedisEventType.coinPurchaseResponse, JSON.stringify(data));
            // console.log("📤 Published response to coin_purchase_response:", data);
        } catch (error) {
            throw error;
            // console.esrror("Error publishing response:", error);
        }
    }


    async pushToCoinPurchaseQueue(data: any, queueName: string = ERedisEventType.coinPurchase,orderId:any) {
        try {
            let payload = {
                userId: data?.userId,
                eventName: data?.eventName,
                payload: data?.payload,
                status: ECoinStatus.active,
                documentStatus: ECoinStatus.pending,
                triggeredAt: new Date(),
                sourceId: data?.sourceId,
                sourceType: data?.sourceType,
                consumer: data?.consumer,
            }
            let createEvent = await this.createEventOutBox(payload);
            const queuePayload = {
                orderId,
                eventOutBoxId: createEvent?._id
            };
            await this.client.lPush(queueName, JSON.stringify(queuePayload));
            // console.log(`📤 Pushed data to ${queueName}:`, queuePayload);
        } catch (error) {
            throw error;
            // console.error(`Error pushing data to ${queueName}:`, error);
        }
    }
    async pushToIntermediateTransferQueue(data: any,orderId:any) {
        try{
            await this.pushToCoinPurchaseQueue(data, ERedisEventType.intermediateTransfer,orderId);
        }catch(error){
            throw error;
        }
    }
    async updateEventOutBox(payload: any) {
        try {
            const parsed = JSON.parse(payload?.element);
            const eventOutBoxId = parsed.eventOutBoxId;
            let updateData = await this.eventOutBoxModel.updateOne({
                _id:new ObjectId(eventOutBoxId),
                status: ECoinStatus.active,
                userId:new ObjectId(parsed.payload?.userId),
                documentStatus: ECoinStatus.pending,
                // eventName: ERedisEventType.coinPurchase,
            }, {
                $set: {
                    documentStatus: ECoinStatus.completed,
                    updatedAt: new Date(),
                }
            });
            return updateData;
        } catch (error) {
            throw error;
            // console.error("Error pushing data to eventOutBox:", error);
        }
    }
    async createEventOutBox(payload: any) {
        try {
            let createData = await this.eventOutBoxModel.create(payload);
            return createData;
        } catch (error) {
            // console.error("Error creating eventOutBox:", error);
            throw error;
        }
    }
}
