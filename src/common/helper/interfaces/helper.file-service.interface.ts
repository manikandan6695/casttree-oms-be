import { WorkBook } from "xlsx";
import {
  IHelperFileRows,
  IHelperFileCreateExcelWorkbookOptions,
  IHelperFileWriteExcelOptions,
  IHelperFileReadExcelOptions,
} from "./helper.interface";

export interface IHelperFileService {
  createExcelWorkbook(
    rows: IHelperFileRows[],
    options?: IHelperFileCreateExcelWorkbookOptions,
  ): WorkBook;
  writeExcelToBuffer(
    workbook: WorkBook,
    options?: IHelperFileWriteExcelOptions,
  ): Buffer;
  readExcelFromBuffer(
    file: Buffer,
    options?: IHelperFileReadExcelOptions,
  ): IHelperFileRows[][];
  convertToBytes(megabytes: string): number;
}
