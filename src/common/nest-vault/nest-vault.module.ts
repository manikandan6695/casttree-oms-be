import { DynamicModule, Global, Module } from "@nestjs/common";
import { NEST_VAULT_CONFIG_OPTIONS } from "./constants";
import { NestVaultService } from "./nest-vault.service";
import { NestVaultOptions } from "./nest-vault-options.interface";
import NodeVault from "node-vault";

@Global()
@Module({ providers: [NestVaultService], exports: [NestVaultService] })
export class NestVaultModule {
  static async registerAsync(
    options: NestVaultOptions,
  ): Promise<DynamicModule> {
    const nodeVault = NodeVault(options);
    const vaultResponse = await nodeVault.read(options.configPath);
    const vaultData = vaultResponse?.data?.data;
    return {
      global: true,
      module: NestVaultModule,
      providers: [
        {
          provide: NEST_VAULT_CONFIG_OPTIONS,
          useFactory: () => {
            return { ...options, vaultData };
          },
        },
        NestVaultService,
      ],
      exports: [NestVaultService, NEST_VAULT_CONFIG_OPTIONS],
    };
  }
}
