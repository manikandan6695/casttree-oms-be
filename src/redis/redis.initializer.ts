import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisInitializer implements OnApplicationBootstrap {
  constructor(private readonly redisService: RedisService) {}

  async onApplicationBootstrap() {
    await this.redisService.startPolling();
  }
}
