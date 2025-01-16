import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { ServiceItemService } from "src/item/service-item.service";
import { processModel } from "./schema/process.schema";
import { processInstanceModel } from "./schema/processInstance.schema";
import { processInstanceDetailModel } from "./schema/processInstanceDetails.schema";
import { taskModel } from "./schema/task.schema";
import { SubscriptionService } from "src/subscription/subscription.service";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { PaymentRequestService } from "src/payment/payment-request.service";

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
  ) {}
  async getTaskDetail(processId, taskId, token) {
    try {
      let subscription = await this.subscriptionService.validateSubscription(
        token.id
      );
      let payment = await this.paymentService.getPaymentDetailBySource(
        processId,
        token.id
      );
      let isProcessExist = await this.processInstancesModel.findOne({
        processId: processId,
        processStatus: "Started",
        userId: token.id,
      });
      if (isProcessExist) {
        taskId = isProcessExist.currentTask;
      }
      console.log(taskId, isProcessExist);
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
        _id: { $gt: taskId },
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
          const newTime = new Date(
            currentTime.getTime() + parseInt(breakDuration) * 60000
          );
          const endAt = newTime.toISOString();
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
      let pendingProcessInstanceData: any = await this.processInstancesModel
        .find({ userId: userId, processStatus: "Started" })
        .populate("currentTask")
        .lean();
      for (let i = 0; i < pendingProcessInstanceData.length; i++) {
        let totalTasks = (
          await this.tasksModel.countDocuments({
            parentProcessId: pendingProcessInstanceData[i].processId,
          })
        ).toString();
        pendingProcessInstanceData[i].completed = Math.ceil(
          (parseInt(pendingProcessInstanceData[i].currentTask.taskNumber) /
            parseInt(totalTasks)) *
            100
        );
      }

      return pendingProcessInstanceData;
    } catch (err) {
      throw err;
    }
  }

  async getMySeries(userId, status) {
    try {
      let userProcessInstanceData: any = await this.processInstancesModel
        .find({ userId: userId, processStatus: status })
        .populate("currentTask")
        .populate("processId")
        .lean();
      let processIds = [];
      for (let i = 0; i < userProcessInstanceData.length; i++) {
        processIds.push(userProcessInstanceData[i].processId);
      }
      let mentorDetails =
        await this.serviceItemService.getMentorUserIds(processIds);
      for (let i = 0; i < userProcessInstanceData.length; i++) {
        userProcessInstanceData[i]["mentorName"] = mentorDetails[i].displayName;
        userProcessInstanceData[i]["mentorImage"] = mentorDetails[i].media;
        let totalTasks = (
          await this.tasksModel.countDocuments({
            parentProcessId: userProcessInstanceData[i].processId,
          })
        ).toString();
        userProcessInstanceData[i]["progressPercentage"] = Math.ceil(
          (parseInt(userProcessInstanceData[i].currentTask.taskNumber) /
            parseInt(totalTasks)) *
            100
        );
      }
      return userProcessInstanceData;
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
        { $sort: { createdAt: 1 } },
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
