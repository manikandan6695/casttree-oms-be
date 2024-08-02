import { HttpStatus } from "@nestjs/common";

export class AppException extends Error {
  readonly message: string;
  readonly code: HttpStatus;
  constructor(message: string, code: HttpStatus) {
    super(message);
    this.message = message;
    this.code = code;
  }
  getMessage() {
    return this.message;
  }
  getCode() {
    return this.code;
  }
}
