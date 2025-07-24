import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetToken = createParamDecorator((data, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  console.log("req user is",req.user);
  
  return req.user;
});
