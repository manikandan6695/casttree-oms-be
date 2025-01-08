import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { errorResponseSchema } from './schema/errorResponse.schema';
import { processSchema } from './schema/process.schema';
import { processInstanceSchema } from './schema/processInstance.schema';
import { processInstanceDetailSchema } from './schema/processInstanceDetails.schema';
import { taskSchema } from './schema/task.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "errorResponses", schema: errorResponseSchema },
      { name: "process", schema: processSchema },
      { name: "processInstance", schema: processInstanceSchema },
      { name: "processInstanceDetail", schema: processInstanceDetailSchema },
      { name: "task", schema: taskSchema},
    ]),
    
    // ItemModule

  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
