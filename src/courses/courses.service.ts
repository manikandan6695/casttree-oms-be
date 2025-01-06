import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { processModel } from './schema/process.schema';
import { processInstanceModel } from './schema/processInstance.schema';
import { processInstanceDetailsModel } from './schema/processInstanceDetails.schema';
import { subprocessModel } from './schema/subprocess.schema';
import { taskModel } from './schema/task.schema';

@Injectable()
export class CoursesService {
    constructor(
        @InjectModel("subprocess")
        private readonly subprocessModel: Model<subprocessModel>,
        @InjectModel("processes")
        private readonly processesModel: Model<processModel>,
        @InjectModel("processInstances")
        private readonly processInstancesModel: Model<processInstanceModel>,
        @InjectModel("processInstanceDetails")
        private readonly processInstanceDetailsModel: Model<processInstanceDetailsModel>,
        @InjectModel("tasks")
        private readonly tasksModel: Model<taskModel>,
    ) { }
    async getTaskDetail(processId, taskId) {
        try {
            let currentTaskData: any = await this.tasksModel.findOne({ parentProcessId: processId, _id: taskId });
            let finalResponse = {};
            let totalTasks = (await this.tasksModel.countDocuments({ parentProcessId: processId})).toString();
            finalResponse["taskId"] = currentTaskData._id;
            finalResponse["parentProcessId"] = currentTaskData.parentProcessId;
            finalResponse["processId"] = currentTaskData.processId;
            finalResponse["taskType"] = currentTaskData.type;
            finalResponse["taskNumber"] = currentTaskData.taskNumber;
            finalResponse["taskTitle"] = currentTaskData.title;
            finalResponse["taskData"] = currentTaskData.taskMetaData;
            finalResponse["totalTasks"] = totalTasks;
            let nextTaskData = await this.tasksModel.findOne({ _id: { $gt: taskId } });
            let nextTask = {
                "taskId" :nextTaskData._id,
                "parentProcessId" : nextTaskData.parentProcessId,
                "processId" : nextTaskData.processId,
                "nextTaskTitle": nextTaskData.title,
                "nextTaskType": nextTaskData.type,
                "isLocked": nextTaskData.isLocked,
                "nextTaskThumbnail": nextTaskData.taskMetaData?.media[0]?.mediaUrl 
            }
            finalResponse["nextTaskData"] = nextTask;
            return finalResponse;
        } catch (err) {
            throw err
        }
    }
    async createProcessInstance(body, token) {
        try {
            body.userId = token.id;
            body.createdBy = token.id;
            body.updatedBy = token.id;
            let processInstanceData = await this.processInstancesModel.create(body);
            let processInstanceDetailBody = {
                "processInstanceId": processInstanceData._id,
                "processId": body.currentSubProcess,
                "parentProcessId": body.processId,
                "taskId": body.currentTask,
                "taskResponse": null,
                "taskStatus": "Inprogress",
                "triggeredAt": body.startedAt,
                "startedAt": body.startedAt
            }
            let processInstanceDetailData = await this.processInstanceDetailsModel.create(processInstanceDetailBody)
            let finalResponse = {
                "processInstanceData": processInstanceData,
                "processInstanceDetailData": processInstanceDetailData

            }
            return finalResponse;

        } catch (err) {
            throw err;
        }
    }

    async pendingProcess(userId) {
        try {
            
            let pendingProcessInstanceData: any = await this.processInstancesModel.findOne({userId:userId}).populate("currentTask").lean();
            let totalTasks = (await this.tasksModel.countDocuments({ parentProcessId: pendingProcessInstanceData.processId})).toString();
                pendingProcessInstanceData.completed = Math.ceil((parseInt(  pendingProcessInstanceData.currentTask.taskNumber) / parseInt( totalTasks))*100);
            return pendingProcessInstanceData;

        } catch (err) {
            throw err;
        }
    }


    async getMySeries(userId,status) {
        try {
            
            let userProcessInstanceData: any = await this.processInstancesModel.find({userId:userId,processStatus:status}).populate("currentTask").populate("processId");
            return userProcessInstanceData;

        } catch (err) {
            throw err;
        }
    }

    async getAllTasks(parentProcessId) {
        try {
            let allTaskdata : any = await this.tasksModel.find({parentProcessId:parentProcessId});
            return allTaskdata;

        } catch (err) {
            throw err;
        }
    }



}
