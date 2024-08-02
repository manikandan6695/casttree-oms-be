import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ISystemConfigurationModel } from "src/configuration/schema/system-configuration.schema";

export const GetSystemConfiguration = createParamDecorator(
  (key, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    let system_configuration =
      req.system_configuration as ISystemConfigurationModel[];
    if (key) {
      let sel_config = system_configuration.find((e) => e.key == key);
      return sel_config.value;
    }
    return req.system_configuration;
  }
);
