import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { IORedisKey } from "./redis.constants";
import { RedisDTO } from "./dto/redis.dto";

@Injectable()
export class RedisService {
  constructor(
    @Inject(IORedisKey)
    public readonly redisClient: Redis
  ) {}

  async setAwsPersonalizeData(
    key: string,
    data: string[],
    expireTime: number | string
  ): Promise<boolean> {
    try {
      console.log("key", key, "expireTime", expireTime);
      const keyPrefix = `nkb:${key}`;
      await this.redisClient.del(keyPrefix);
      await this.redisClient.rpush(keyPrefix, ...data);
      await this.redisClient.expire(keyPrefix, expireTime);
      return true;
    } catch (error) {
      console.error("Error saving data to Redis:", error);
      return false;
    }
  }
  async setKeyValue(
    key: string,
    setRecommendationId: string,
    expireTime: number | string
  ) {
    try {
      const keyPrefix = `nkb:${key}`;
      await this.redisClient.del(keyPrefix);
      await this.redisClient.set(keyPrefix, setRecommendationId);
      await this.redisClient.expire(keyPrefix, expireTime);
      return true;
    } catch (error) {
      console.error("Error saving data to Redis:", error);
      return false;
    }
  }
  async getValue(key: string): Promise<string | undefined> {
    const keyPrefix = `nkb:${key}`;
    const data = await this.redisClient.get(keyPrefix);
    return data;
  }

  async delete(key: string): Promise<boolean> {
    try {
      // const keyPrefix = `nkb:${key}`;
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      console.error("Error deleting data from Redis:", error);
      return false;
    }
  }

  async getKeys(type: string): Promise<string[]> {
    try {
      const keyPrefix = `${type}*`;
      const keys = await this.redisClient.keys(keyPrefix);
      return keys;
    } catch (error) {
      console.error("Error getting keys from Redis:", error);
      return [];
    }
  }

  async get(key: string): Promise<any[]> {
    try {
      const data = await this.redisClient.get(key);
      if (!data) {
        console.log("No data found in Redis for key:", key);
        return null;
      }
      const parsedData = JSON.parse(data);
      return parsedData;
    } catch (error) {
      console.error("Error getting data from Redis:", error);
      return null;
    }
  }
  async getRawRedisData(key: string): Promise<any> {
    const keyType = await this.redisClient.type(key);

    switch (keyType) {
      case "string":
        return await this.redisClient.get(key);

      case "hash":
        return await this.redisClient.hgetall(key);

      case "list":
        console.log("list");

        return await this.redisClient.lrange(key, 0, -1);

      case "set":
        return await this.redisClient.smembers(key);

      case "zset":
        return await this.redisClient.zrange(key, 0, -1);

      case "none":
        return null;
      default:
        return null;
    }
  }

  async fetchDataByKey(key: string) {
    const data = await this.redisClient.get(key);
    return data;
  }

  async findKeysByType(type: string): Promise<any> {
    const pattern = `${type}-*`;
    const keys = await this.redisClient.keys(pattern);
    const data = await this.getDataForKeys(keys);
    return data;
  }
  async getDataForKeys(keys: string[]): Promise<any[]> {
    if (keys.length === 0) {
      return [];
    }
    const keysData = this.redisClient.mget(keys);
    return keysData;
  }
  async createBulkRedisValue(bulkData: RedisDTO[]): Promise<string> {
    const pipeline = this.redisClient.multi();
    try {
      if (!bulkData.length) {
        throw new BadRequestException("Data not found");
      }
      bulkData.forEach((item) => {
        pipeline.set(item.key, JSON.stringify(item.value));
        if (item?.expireTime) {
          pipeline.expire(item.key, item.expireTime);
        }
      });
      await pipeline.exec();
      return "Bulk saved";
    } catch (error) {
      console.error("error from create bulk redis value, error:", error);
      throw error;
    }
  }
}
