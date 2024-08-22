import { IBaseEventEmitter } from "src/shared/interfaces/base-event.interface";

export interface IUpdateNominationStatusByRequestEvent
  extends IBaseEventEmitter {
  requestId: any;
  isPassed: boolean;
  token: string;
}
