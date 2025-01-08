import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { ServiceItemService } from 'src/item/service-item.service';
import { processModel } from './schema/process.schema';
import { processInstanceModel } from './schema/processInstance.schema';
import { processInstanceDetailModel } from './schema/processInstanceDetails.schema';
import { taskModel } from './schema/task.schema';



@Injectable()
export class CoursesService {
    constructor(
        @InjectModel("process")
        private readonly processesModel: Model<processModel>,
        @InjectModel("processInstance")
        private readonly processInstancesModel: Model<processInstanceModel>,
        @InjectModel("processInstanceDetail")
        private readonly processInstanceDetailsModel: Model<processInstanceDetailModel>,
        @InjectModel("task")
        private readonly tasksModel: Model<taskModel>,
        @Inject(forwardRef(() => ServiceItemService))
        private serviceItemService: ServiceItemService
    ) { }
    async getTaskDetail(processId, taskId, token) {
        try {

            let currentTaskData: any = await this.tasksModel.findOne({ parentProcessId: processId, _id: taskId });
            let finalResponse = {};
            let totalTasks = (await this.tasksModel.countDocuments({ parentProcessId: processId })).toString();
            finalResponse["taskId"] = currentTaskData._id;
            finalResponse["parentProcessId"] = currentTaskData.parentProcessId;
            finalResponse["processId"] = currentTaskData.processId;
            finalResponse["taskType"] = currentTaskData.type;
            finalResponse["taskNumber"] = currentTaskData.taskNumber;
            finalResponse["taskTitle"] = currentTaskData.title;
            finalResponse["taskData"] = currentTaskData.taskMetaData;
            finalResponse["totalTasks"] = totalTasks;
            let nextTaskData = await this.tasksModel.findOne({ _id: { $gt: taskId } });
            let nextTask = {};
            if (nextTaskData) {
                nextTask = {
                    "taskId": nextTaskData._id,
                    "parentProcessId": nextTaskData.parentProcessId,
                    "processId": nextTaskData.processId,
                    "nextTaskTitle": nextTaskData.title,
                    "nextTaskType": nextTaskData.type,
                    "isLocked": nextTaskData.isLocked,
                    "nextTaskThumbnail": nextTaskData.taskMetaData?.media[0]?.mediaUrl
                }
            }

            finalResponse["nextTaskData"] = nextTask;
            let updateProcessInstanceData = await this.createProcessInstance(token.id, processId, taskId, currentTaskData.type);
            return finalResponse;
        } catch (err) {
            throw err
        }
    }
    async createProcessInstance(userId, processId, taskId, taskType) {
        try {
            let checkInstanceHistory = await this.processInstancesModel.findOne({ userId: userId, currentTask: taskId, status: "Active" });
            let finalResponse = {};
            if (!checkInstanceHistory) {
                const currentTime = new Date();
                let currentTimeIso = currentTime.toISOString();
                let processInstanceBody = {
                    "userId": userId,
                    "processId": processId,
                    "processType": taskType,
                    "processStatus": "Started",
                    "currentTask": taskId,
                    "status": "Active",
                    "startedAt": currentTimeIso,
                    "createdBy": userId,
                    "updatedBy": userId

                }
                let processInstanceData = await this.processInstancesModel.create(processInstanceBody);
                let processInstanceDetailBody = {
                    "processInstanceId": processInstanceData._id,
                    "processId": processId,
                    "taskId": taskId,
                    "taskStatus": "Started",
                    "triggeredAt": currentTimeIso,
                    "startedAt": currentTimeIso,
                    "status": "Active",
                    "createdBy": userId,
                    "updatedBy": userId
                }
                let processInstanceDetailData = await this.processInstanceDetailsModel.create(processInstanceDetailBody)
                finalResponse = {
                    "processInstanceData": processInstanceData,
                    "processInstanceDetailData": processInstanceDetailData

                }
            }

            return finalResponse;

        } catch (err) {
            throw err;
        }
    }


    async updateProcessInstance(body, token) {
        try {
            console.log("service");
            let processInstanceBody = {};
            let processInstanceDetailBody = {};

            const currentTime = new Date();
            let currentTimeIso = currentTime.toISOString();
            if (body.orderId) {
                processInstanceBody["orderId"] = body.orderId;
                processInstanceBody["purchasedAt"] = currentTimeIso;
                processInstanceBody["validTill"] = currentTimeIso;
            }
            if (body.processStatus) {
                processInstanceBody["processStatus"] = body.processStatus;
                processInstanceDetailBody["taskStatus"] = body.processStatus;


                if (body.processStatus == "Completed") {
                    processInstanceDetailBody["taskResponse"] = body.taskResponse;
                    processInstanceDetailBody["endedAt"] = currentTimeIso;
                }

            }
            console.log(body.taskId, token.id, processInstanceBody);
            let processInstanceData = await this.processInstancesModel.updateOne({ currentTask: new ObjectId(body.taskId), userId: new ObjectId(token.id) }, { $set: processInstanceBody });
            let processInstanceDetailData = await this.processInstanceDetailsModel.updateOne({ taskId: new ObjectId(body.taskId), createdBy: new ObjectId(token.id) }, { $set: processInstanceDetailBody });
            let finalResponse = {
                "message": "updated",
            }

            return finalResponse;

        } catch (err) {
            throw err;
        }
    }

    async pendingProcess(userId) {
        try {

            let pendingProcessInstanceData: any = await this.processInstancesModel.find({ userId: userId, processStatus: "Started" }).populate("currentTask").lean();
            for (let i = 0; i < pendingProcessInstanceData.length; i++) {
                let totalTasks = (await this.tasksModel.countDocuments({ parentProcessId: pendingProcessInstanceData[i].processId })).toString();
                pendingProcessInstanceData[i].completed = Math.ceil((parseInt(pendingProcessInstanceData[i].currentTask.taskNumber) / parseInt(totalTasks)) * 100);
            }

            return pendingProcessInstanceData;

        } catch (err) {
            throw err;
        }
    }


    async getMySeries(userId, status) {
        try {

            let userProcessInstanceData: any = await this.processInstancesModel.find({ userId: userId, processStatus: status }).populate("currentTask").populate("processId").lean();
            let processIds = [];
            for (let i = 0; i < userProcessInstanceData.length; i++) {
                processIds.push(userProcessInstanceData[i].processId);
            }
            let mentorDetails = await this.serviceItemService.getMentorUserIds(processIds);
            for (let i = 0; i < userProcessInstanceData.length; i++) {
                userProcessInstanceData[i]["displayName"] = mentorDetails[i].displayName;
                userProcessInstanceData[i]["media"] = mentorDetails[i].media;
            }
            return userProcessInstanceData;

        } catch (err) {
            throw err;
        }
    }

    async getAllTasks(parentProcessId) {
        try {
            let allTaskdata: any = await this.tasksModel.find({ parentProcessId: parentProcessId });
            return allTaskdata;

        } catch (err) {
            throw err;
        }
    }

    async getFirstTask(
        processIds
    ) {
        try {
            let processObjIds = processIds.map((e) => new ObjectId(e));
            return this.tasksModel.aggregate([
                { $match: { "processId": { $in: processObjIds } } },
                { $sort: { createdAt: 1 } },
                {
                    $group: {
                        _id: "$processId",
                        firstTask: { $first: "$$ROOT" }
                    }
                },
                { $replaceRoot: { newRoot: "$firstTask" } }
            ]);

        } catch (err) {
            throw err;
        }
    }



}
