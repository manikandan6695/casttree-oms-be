import { IQueryResult } from "@nestjs/cqrs";

export class FindPageByIdResult implements IQueryResult {
  readonly id: string;
  readonly userName: string;
  readonly firstName: string;
  readonly lastName: string | null;
  readonly email: string;
  readonly mobileNumber: string | null;
}
