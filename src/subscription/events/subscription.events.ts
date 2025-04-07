import { IBaseEventEmitter } from "src/shared/interfaces/base-event.interface";

export interface IRaiseChargeEvent extends IBaseEventEmitter {
    subscriptionData: any;
    planDetail: any;
}