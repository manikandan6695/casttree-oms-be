import { Module } from '@nestjs/common';
import { MandatesController } from './mandates.controller';

@Module({
  controllers: [MandatesController]
})
export class MandatesModule {}
