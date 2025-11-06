import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MetaBaseController } from './metabase.controller';
import { MetaBaseService } from './metabase.service';
import { RedisModule } from '../redis/redis.module';
import { SharedModule } from '../shared/shared.module';
import { HelperModule } from 'src/helper/helper.module';
import { ItemModule } from 'src/item/item.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    RedisModule,
    SharedModule,
    HelperModule,
    forwardRef(() => ItemModule)
  ],
  controllers: [MetaBaseController],
  providers: [MetaBaseService],
  exports: [MetaBaseService],
})
export class MetaBaseModule {}
