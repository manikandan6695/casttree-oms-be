import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { errorResponseSchema } from './schema/errorResponse.schema';
import { processSchema } from './schema/process.schema';
import { processInstanceSchema } from './schema/processInstance.schema';
import { processInstanceDetailsSchema } from './schema/processInstanceDetails.schema';
import { subprocessSchema } from './schema/subprocess.schema';
import { taskSchema } from './schema/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "subprocess", schema: subprocessSchema },
      { name: "errorResponses", schema: errorResponseSchema },
      { name: "processes", schema: processSchema },
      { name: "processInstances", schema: processInstanceSchema },
      { name: "processInstanceDetails", schema: processInstanceDetailsSchema },
      { name: "tasks", schema: taskSchema},
    ]),

  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService
    ],
})
export class CoursesModule {}
