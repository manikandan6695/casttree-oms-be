import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { Estatus } from "src/item/enum/status.enum";
import { ServiceItemService } from "src/item/service-item.service";
import { PaymentRequestService } from "src/payment/payment-request.service";
import { SubscriptionService } from "src/subscription/subscription.service";
import { EprocessStatus, EtaskType } from "./enums/courses.enum";
import { processInstanceModel } from "./schema/processInstance.schema";
import { processInstanceDetailModel } from "./schema/processInstanceDetails.schema";
import { taskModel } from "./schema/task.schema";

@Injectable()
export class ProcessService {
  constructor(
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
      let currentTaskData: any = await this.tasksModel.findOne({
        processId: processId,
        _id: taskId,
      });
      let finalResponse = {};
      let totalTasks = (
        await this.tasksModel.countDocuments({ processId: processId })
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
      if (nextTaskData) {
        //nextTaskData = await this.tasksModel.findOne({ processId: processId });
        nextTask = {
          taskId: nextTaskData._id,
          parentProcessId: nextTaskData.parentProcessId,
          processId: nextTaskData.processId,
          nextTaskTitle: nextTaskData.title,
          nextTaskType: nextTaskData.type,
          nextTaskThumbnail: await this.getNextTaskThumbNail(nextTaskData?.taskMetaData?.media),
          taskNumber: nextTaskData.taskNumber,
        };
        nextTask["isLocked"] =
          subscription || payment.paymentData.length
            ? false
            : nextTaskData.isLocked;
      }
      
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
      console.log("break:" +  breakDuration);
      let CurrentInstanceData;
      const currentTime = new Date();
      let currentTimeIso = currentTime.toISOString();
      let checkInstanceHistory = await this.processInstancesModel.findOne({
        userId: userId,
        processId: processId,
        status: Estatus.Active,
      });
      let finalResponse = {};
      if (!checkInstanceHistory) {
        let processInstanceBody = {
          userId: userId,
          processId: processId,
          processStatus: EprocessStatus.Started,
          currentTask: taskId,
          status: Estatus.Active,
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
          taskStatus: EprocessStatus.Started,
          triggeredAt: currentTimeIso,
          startedAt: currentTimeIso,
          status: Estatus.Active,
          createdBy: userId,
          updatedBy: userId,
        };
        if (taskType == EtaskType.Break) {
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
          breakEndsAt: processInstanceDetailData.endedAt,
        }
      } else {
        let checkTaskInstanceDetailHistory = await this.processInstanceDetailsModel.findOne({
          createdBy: userId,
          processId: processId,
          taskId: taskId
        });
        if (checkTaskInstanceDetailHistory) {
          if (taskType == "Break") {
            finalResponse = {
              breakEndsAt: checkTaskInstanceDetailHistory.endedAt,
            };
          }
          
        } else {
          let updateProcessInstanceTask = await this.processInstancesModel.updateOne({ _id: checkInstanceHistory._id }, { $set: { currentTask: taskId } })
          let processInstanceDetailBody = {
            processInstanceId: checkInstanceHistory._id,
            processId: processId,
            taskId: taskId,
            taskStatus: EprocessStatus.Started,
            triggeredAt: currentTimeIso,
            startedAt: currentTimeIso,
            status: Estatus.Active,
            createdBy: userId,
            updatedBy: userId,
          };
          if (taskType == EtaskType.Break) {
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
        }
        if (taskType == EtaskType.Break) {
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
      let isLastTask = false;
      let processInstanceBody = {};
      let processInstanceDetailBody = {};
      const currentTime = new Date();
      let currentTimeIso = currentTime.toISOString();
      if (body.processStatus) {
        processInstanceDetailBody["taskStatus"] = body.processStatus;
        if (body.taskType == EtaskType.Break) {
          const newTime = new Date(
            currentTime.getTime() + parseInt(body.timeDurationInMin) * 60000
          );
          const endAt = newTime.toISOString();
          processInstanceDetailBody["endedAt"] = endAt;
        }
        if (body.processStatus == EprocessStatus.Completed) {
          processInstanceDetailBody["taskResponse"] = body.taskResponse;
          processInstanceDetailBody["endedAt"] = currentTimeIso;
        }
      }
      let taskDetail = await this.tasksModel.findOne({ _id: new ObjectId(body.taskId) })
      let totalTasks = await this.tasksModel.countDocuments({ processId: taskDetail.processId });
      if (totalTasks == taskDetail.taskNumber) {
        processInstanceBody["processStatus"] = EprocessStatus.Completed;
        let processInstanceData = await this.processInstancesModel.updateOne(
          {
            processId: taskDetail.processId,
            userId: new ObjectId(token.id),
          },
          { $set: processInstanceBody }
        );
      }

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
      console.log(userId)
      const pendingTasks: any = await this.processInstanceDetailsModel.find({ createdBy: userId, taskStatus: EprocessStatus.Started }).populate("taskId").lean();

      for (let i = 0; i < pendingTasks.length; i++) {
        let totalTasks = (
          await this.tasksModel.countDocuments({
            processId: pendingTasks[i].processId,
          })
        ).toString();
        pendingTasks[i].completed = Math.ceil(
          (parseInt(pendingTasks[i].taskId.taskNumber) /
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

      const mySeries: any = await this.processInstancesModel.find({ userId: userId, processStatus: status }).populate("currentTask").lean();
      for (let i = 0; i < mySeries.length; i++) {
        let totalTasks = (
          await this.tasksModel.countDocuments({
            processId: mySeries[i].processId,
          })
        ).toString();

        mySeries[i].progressPercentage = Math.ceil(
          (parseInt(mySeries[i].currentTask.taskNumber) /
            parseInt(totalTasks)) *
          100
        );

        if (status == EprocessStatus.Completed) {
          mySeries[i].completed = 100;
          let currentTask = await this.tasksModel.findOne({ processId: mySeries[i].processId, taskNumber: 1 });
          mySeries[i].currentTask = currentTask;
        }

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

  async getAllTasks(processId, token: UserToken) {
    try {
      let subscription = await this.subscriptionService.validateSubscription(
        token.id
      );
      let userProcessInstanceData: any = await this.processInstanceDetailsModel.find({ processId: processId, createdBy: token.id }).lean();

      let createdInstanceTasks = [];
      for (let i = 0; i < userProcessInstanceData.length; i++) {
        createdInstanceTasks.push(userProcessInstanceData[i].taskId.toString())
      }
      let payment = await this.paymentService.getPaymentDetailBySource(
        processId,
        token.id
      );
      let allTaskdata: any = await this.tasksModel.find({
        processId: processId,
      }).sort({ taskNumber: 1 }).lean();

      allTaskdata.forEach((task) => {
        console.log(task);
        if (createdInstanceTasks.includes(task._id.toString())) {
          console.log(true)
          task.isCompleted = true;
        } else {
          task.isCompleted = false;
        }
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

  async getNextTaskThumbNail(media) {
    let mediaUrl = "";
    media.forEach((mediaData) => {
      if (mediaData.type === "thumbNail") {
        mediaUrl = mediaData.mediaUrl;
      }
    });
    return mediaUrl;
  }
}
