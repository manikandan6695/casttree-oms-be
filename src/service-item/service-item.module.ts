import { Module } from '@nestjs/common';
import { ServiceItemController } from './service-item.controller';
import { ServiceItemService } from './service-item.service';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { serviceItemSchema } from './schema/serviceIte.schema';

@Module({
  imports:[MongooseModule.forFeature([
    {
      name: "serviceItem",
      schema: serviceItemSchema
    }
   
  ])],
  controllers: [ServiceItemController],
  providers: [ServiceItemService]
})
export class ServiceItemModule {}
