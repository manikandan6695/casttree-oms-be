import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { ServiceItemService } from "src/item/service-item.service";
import { PaymentRequestService } from "src/payment/payment-request.service";
import { SubscriptionService } from "src/subscription/subscription.service";
import { processModel } from "./schema/process.schema";
import { processInstanceModel } from "./schema/processInstance.schema";
import { processInstanceDetailModel } from "./schema/processInstanceDetails.schema";
import { taskModel } from "./schema/task.schema";

@Injectable()
export class ProcessService {
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
    private serviceItemService: ServiceItemService,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentRequestService
  ) { }
  async getTaskDetail(processId, taskId, token) {
    try {
      let subscription = await this.subscriptionService.validateSubscription(
        token.id
      );
      let payment = await this.paymentService.getPaymentDetailBySource(
        processId,
        token.id
      );
      /*let isProcessExist = await this.processInstancesModel.findOne({
        processId: processId,
        processStatus: "Started",
        userId: token.id,
      });
      if (isProcessExist) {
        taskId = isProcessExist.currentTask;
      }
      console.log(taskId, isProcessExist);*/
      let currentTaskData: any = await this.tasksModel.findOne({
        parentProcessId: processId,
        _id: taskId,
      });
      let finalResponse = {};
      let totalTasks = (
        await this.tasksModel.countDocuments({ parentProcessId: processId })
      ).toString();
      finalResponse["taskId"] = currentTaskData._id;
      finalResponse["parentProcessId"] = currentTaskData.parentProcessId;
      finalResponse["processId"] = currentTaskData.processId;
      finalResponse["taskType"] = currentTaskData.type;
      finalResponse["taskNumber"] = currentTaskData.taskNumber;
      finalResponse["taskTitle"] = currentTaskData.title;
      finalResponse["taskData"] = currentTaskData.taskMetaData;
      finalResponse["totalTasks"] = totalTasks;
      finalResponse["isLocked"] = !(subscription || payment.paymentData.length)
        ? currentTaskData.isLocked
        : false;

      let nextTaskData = await this.tasksModel.findOne({
        taskNumber: (currentTaskData.taskNumber + 1),
        processId: processId,
      });
      let nextTask = {};
      if (!nextTaskData) {
        nextTaskData = await this.tasksModel.findOne({ processId: processId });
      }
      nextTask = {
        taskId: nextTaskData._id,
        parentProcessId: nextTaskData.parentProcessId,
        processId: nextTaskData.processId,
        nextTaskTitle: nextTaskData.title,
        nextTaskType: nextTaskData.type,

        nextTaskThumbnail: nextTaskData.taskMetaData?.media[0]?.mediaUrl,
        taskNumber: nextTaskData.taskNumber,
      };
      nextTask["isLocked"] =
        subscription || payment.paymentData.length
          ? false
          : nextTaskData.isLocked;
      finalResponse["nextTaskData"] = nextTask;
      let createProcessInstanceData;
      if (currentTaskData.type == "Break") {
        createProcessInstanceData = await this.createProcessInstance(
          token.id,
          processId,
          taskId,
          currentTaskData.type,
          currentTaskData.taskMetaData.timeDurationInMin
        );
      } else {
        createProcessInstanceData = await this.createProcessInstance(
          token.id,
          processId,
          taskId,
          currentTaskData.type
        );
      }
      finalResponse["processInstanceDetails"] = createProcessInstanceData;
      return finalResponse;
    } catch (err) {
      throw err;
    }
  }
  async createProcessInstance(
    userId,
    processId,
    taskId,
    taskType,
    breakDuration?
  ) {
    try {
      let CurrentInstanceData;

      const currentTime = new Date();
      let currentTimeIso = currentTime.toISOString();
      let checkInstanceHistory = await this.processInstancesModel.findOne({
        userId: userId,
        currentTask: taskId,
        status: "Active",
      });
      let finalResponse = {};
      if (!checkInstanceHistory) {
        let processInstanceBody = {
          userId: userId,
          processId: processId,
          processType: taskType,
          processStatus: "Started",
          currentTask: taskId,
          status: "Active",
          startedAt: currentTimeIso,
          createdBy: userId,
          updatedBy: userId,
        };
        let processInstanceData =
          await this.processInstancesModel.create(processInstanceBody);
        let processInstanceDetailBody = {
          processInstanceId: processInstanceData._id,
          processId: processId,
          taskId: taskId,
          taskStatus: "Started",
          triggeredAt: currentTimeIso,
          startedAt: currentTimeIso,
          status: "Active",
          createdBy: userId,
          updatedBy: userId,
        };
        if (taskType == "Break") {
          const newTime = new Date(
            currentTime.getTime() + parseInt(breakDuration) * 60000
          );
          const endAt = newTime.toISOString();
          processInstanceDetailBody["endedAt"] = endAt;
        }
        let processInstanceDetailData =
          await this.processInstanceDetailsModel.create(
            processInstanceDetailBody
          );
        finalResponse = {
          //"processInstanceData": processInstanceData,
          //"processInstanceDetailData": processInstanceDetailData,
          breakEndsAt: processInstanceDetailData.endedAt,
        };
      } else {
        if (taskType == "Break") {
          /*const newTime = new Date(
            currentTime.getTime() + parseInt(breakDuration) * 60000
          );
          const endAt = newTime.toISOString();*/
          CurrentInstanceData = await this.processInstanceDetailsModel.findOne({
            createdBy: userId,
            taskId: taskId,
          });
          finalResponse = {
            breakEndsAt: CurrentInstanceData.endedAt,
          };
        }
      }
      return finalResponse;
    } catch (err) {
      throw err;
    }
  }

  async updateProcessInstance(body, token) {
    try {
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
        if (body.taskType == "Break") {
          const newTime = new Date(
            currentTime.getTime() + parseInt(body.timeDurationInMin) * 60000
          );
          const endAt = newTime.toISOString();
          processInstanceDetailBody["endedAt"] = endAt;
        }
        if (body.processStatus == "Completed") {
          processInstanceDetailBody["taskResponse"] = body.taskResponse;
          processInstanceDetailBody["endedAt"] = currentTimeIso;
        }
      }
      let processInstanceData = await this.processInstancesModel.updateOne(
        {
          currentTask: new ObjectId(body.taskId),
          userId: new ObjectId(token.id),
        },
        { $set: processInstanceBody }
      );
      let processInstanceDetailData =
        await this.processInstanceDetailsModel.updateOne(
          {
            taskId: new ObjectId(body.taskId),
            createdBy: new ObjectId(token.id),
          },
          { $set: processInstanceDetailBody }
        );
      let finalResponse = {
        message: "updated",
      };

      return finalResponse;
    } catch (err) {
      throw err;
    }
  }

  async pendingProcess(userId) {
    try {
      const pendingTasks = await this.processInstancesModel.aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        {
          $group: {
            _id: '$processId',
            completedCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'task',
            localField: '_id',
            foreignField: 'processId',
            as: 'tasks',
          },
        },
        {
          $addFields: {
            totalTaskCount: { $size: '$tasks' },
          },
        },
        {
          $lookup: {
            from: 'task',
            let: { processId: '$_id', completedCount: '$completedCount' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$processId', '$$processId'] },
                      { $eq: ['$taskNumber', '$$completedCount'] }
                    ],
                  },
                },
              },
            ],
            as: 'currentTask',
          },
        },
        {
          $addFields: {
            currentTask: { $arrayElemAt: ['$currentTask', 0] },
          },
        },
        {
          $match: {
            $expr: { $ne: ['$completedCount', '$totalTaskCount'] },
          },
        },
        {
          $project: {
            _id: 0,
            processId: '$_id',
            //completedCount: 1,
            //totalTaskCount: 1,
            currentTask: 1,
          },
        },
      ]);
      for (let i = 0; i < pendingTasks.length; i++) {
        let totalTasks = (
          await this.tasksModel.countDocuments({
            parentProcessId: pendingTasks[i].processId,
          })
        ).toString();
        pendingTasks[i].completed = Math.ceil(
          (parseInt(pendingTasks[i].currentTask.taskNumber) /
            parseInt(totalTasks)) *
          100
        );
      }

      return pendingTasks;
    } catch (err) {
      throw err;
    }
  }

  async getMySeries(userId, status) {
    try {

      const mySeries = await this.processInstancesModel.aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        {
          $group: {
            _id: '$processId',
            completedCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'task',
            localField: '_id',
            foreignField: 'processId',
            as: 'tasks',
          },
        },
        {
          $addFields: {
            totalTaskCount: { $size: '$tasks' },
          },
        },
        {
          $lookup: {
            from: 'task',
            let: { processId: '$_id', completedCount: '$completedCount' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$processId', '$$processId'] },
                      { $eq: ['$taskNumber', '$$completedCount'] }
                    ],
                  },
                },
              },
            ],
            as: 'currentTask',
          },
        },
        {
          $addFields: {
            currentTask: { $arrayElemAt: ['$currentTask', 0] },
          },
        },
        {
          $match: {
            $expr: (status == "Completed") ? { $eq: ['$completedCount', '$totalTaskCount'] } : { $ne: ['$completedCount', '$totalTaskCount'] },
          },
        },
        {
          $project: {
            _id: 0,
            processId: '$_id',
            //completedCount: 1,
            //totalTaskCount: 1,
            currentTask: 1,
          },
        },
      ]);
      for (let i = 0; i < mySeries.length; i++) {
        let totalTasks = (
          await this.tasksModel.countDocuments({
            parentProcessId: mySeries[i].processId,
          })
        ).toString();
        mySeries[i].completed = Math.ceil(
          (parseInt(mySeries[i].currentTask.taskNumber) /
            parseInt(totalTasks)) *
          100
        );
      }
      let processIds = [];
      for (let i = 0; i < mySeries.length; i++) {
        processIds.push(mySeries[i].processId);
      }
      let mentorDetails =
        await this.serviceItemService.getMentorUserIds(processIds);
      for (let i = 0; i < mySeries.length; i++) {
        mySeries[i]["mentorName"] = mentorDetails[i].displayName;
        mySeries[i]["mentorImage"] = mentorDetails[i].media;
        mySeries[i]["seriesName"] = mentorDetails[i].seriesName;
        mySeries[i]["seriesThumbNail"] = mentorDetails[i].seriesThumbNail;
}
      return mySeries;
    } catch (err) {
      throw err;
    }
  }

  async getAllTasks(parentProcessId, token: UserToken) {
    try {
      let subscription = await this.subscriptionService.validateSubscription(
        token.id
      );
      let payment = await this.paymentService.getPaymentDetailBySource(
        parentProcessId,
        token.id
      );
      let allTaskdata: any = await this.tasksModel.find({
        parentProcessId: parentProcessId,
      });
      if (subscription || payment?.paymentData?.length) {
        allTaskdata.forEach((task) => {
          task.isLocked = false;
        });
      }

      return allTaskdata;
    } catch (err) {
      throw err;
    }
  }

  async getFirstTask(processIds) {
    try {
      let processObjIds = processIds.map((e) => new ObjectId(e));
      return this.tasksModel.aggregate([
        { $match: { processId: { $in: processObjIds } } },
        { $sort: { taskNumber: 1 } },
        {
          $group: {
            _id: "$processId",
            firstTask: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$firstTask" } },
      ]);
    } catch (err) {
      throw err;
    }
  }

  async userProcessDetail(processId, token) {
    try {
      let userProcessDetail = await this.processInstancesModel
        .find({ userId: token.id, processId: processId })
        .populate("currentTask")
        .sort({ _id: 1 });
      return userProcessDetail;
    } catch (err) {
      throw err;
    }
  }
}
