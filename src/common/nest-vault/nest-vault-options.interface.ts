import { ModuleMetadata, FactoryProvider } from "@nestjs/common";

export declare class NestVaultOptions {
  apiVersion: string;
  endpoint: string;
  token: string;
  configPath: string;
}

export interface NodeVaultOptions {
  apiVersion: string;
  endpoint: string;
  token: string;
}

type NestVaultAsyncOptions = Pick<ModuleMetadata, "imports"> &
  Pick<FactoryProvider<NestVaultOptions>, "useFactory" | "inject">;

export default NestVaultAsyncOptions;
