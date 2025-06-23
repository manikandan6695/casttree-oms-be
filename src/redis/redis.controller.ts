import { Controller, Post, Get } from "@nestjs/common";
import { RedisService } from "./redis.service";

@Controller("pub")
export class PublishController {
  constructor(private readonly redisService: RedisService) {}

}
