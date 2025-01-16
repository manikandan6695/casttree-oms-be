import { IBaseEventEmitter } from "src/shared/interfaces/base-event.interface";

export interface IUserUpdateEvent extends IBaseEventEmitter {
  userName: string;
  phoneNumber: string;
  emailId: string;
  phoneCountryCode: string;
  nominationId?: any;
}


