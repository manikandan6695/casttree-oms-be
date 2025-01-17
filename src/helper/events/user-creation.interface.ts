import { IBaseEventEmitter } from "src/shared/interfaces/base-event.interface";

export interface IUserUpdateEvent extends IBaseEventEmitter {
  userId: string;
  membership: string;
  badge: string;
}
