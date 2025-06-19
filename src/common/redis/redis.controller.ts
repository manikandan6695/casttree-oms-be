import { Controller, Get, Param, Post, Body, Delete } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { RedisDTO } from "./dto/redis.dto";

@Controller("redis")
export class RedisController {
  constructor(private readonly redisService: RedisService) { }
  @Post("p/bulk-create")
  async bulkCreate(@Body() bulkData: RedisDTO[]) {
    return await this.redisService.createBulkRedisValue(bulkData);
  }
  @Get("keys/:type")
  async getKeys(@Param("type") type: string): Promise<string[]> {
    return await this.redisService.getKeys(type);
  }
  @Get(":key")
  async getValue(@Param("key") key: string): Promise<any> {
    return await this.redisService.getRawRedisData(key);
  }
  @Delete(":key")
  async delete(@Param("key") key: string): Promise<void> {
    await this.redisService.delete(key);
  }
}
