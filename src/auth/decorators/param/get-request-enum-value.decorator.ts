import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

export interface IEnumValidator {
  type: "body" | "query" | "param";
  value_field: string;
  meta_type: Object;
}

export const GetRequestEnumValue = createParamDecorator(
  (data: IEnumValidator, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    let input =
      data.type == "body"
        ? req.body
        : data.type == "param"
        ? req.param
        : req.query;
    if (!Object.values(data.meta_type).includes(input[data.value_field])) {
      throw new HttpException(
        "Enum value not exist",
        HttpStatus.NOT_ACCEPTABLE
      );
    }
    return true;
  }
);
