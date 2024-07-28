import { ICommandSourceModel } from 'src/shared/schema/command-source.schema';

export interface IBaseEventEmitter {
  commandSource?: ICommandSourceModel;
  cdcOffset?: number;
  cdcPartition?: number;
  date?: Date;
  retries?: number;
}
