import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ERedisEventType } from 'src/payment/enum/payment.enum';
import { PaymentRequestService } from 'src/payment/payment-request.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType;
    private subscriberClient: RedisClientType;
    private coinPurchaseCallback: (data: any) => void;
    private isConnected = false;
    private isPolling = false;
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

            // this.client.on('error', (err) => {
            //     console.error('❌ Redis publisher client error:', err);
            // });

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
        if (!this.isConnected) {
            // console.log("⚠️  Redis not connected, cannot publish response");
            return;
        }
        try {
            await this.client.publish(ERedisEventType.coinPurchaseResponse, JSON.stringify(data));
            // console.log("📤 Published response to coin_purchase_response:", data);
        } catch (error) {
            console.error("Error publishing response:", error);
        }
    }

    async pushCoinPurchaseResponse(data: any, coinTransactionId: string) {
        // console.log("data", data);
        if (!this.isConnected) {
            // console.log("⚠️  Redis not connected, cannot push response");
            return;
        }
        try {
            // console.log("id", coinTransactionId);
            let res = await this.client.lPush(`${ERedisEventType.coinPurchaseResponse}:${coinTransactionId}`, JSON.stringify(data));
            // console.log("📤 Pushed response to coin_purchase_response:", data, res);
        } catch (error) {
            console.error("Error pushing response:", error);
        }
    }

    async pushToCoinPurchaseQueue(orderId: string, queueName: string = ERedisEventType.coinPurchase) {
        if (!this.isConnected) {
            return;
        }
        try {
            await this.client.lPush(queueName, orderId);
            // console.log(`📤 Pushed orderId to ${queueName}:`, orderId);
        } catch (error) {
            console.error(`Error pushing orderId to ${queueName}:`, error);
        }
    }

    async pushToIntermediateTransferQueue(orderId: string) {
        await this.pushToCoinPurchaseQueue(orderId, ERedisEventType.intermediateTransfer);
    }
}
