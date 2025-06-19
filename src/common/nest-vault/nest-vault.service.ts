import { Inject, Injectable } from "@nestjs/common";
import { NEST_VAULT_CONFIG_OPTIONS } from "./constants";
import { NestVaultOptions } from "./nest-vault-options.interface";
import NodeVault from "node-vault";

@Injectable()
export class NestVaultService {
  private _nestVaultCache: Record<string, any> = null;
  constructor(
    @Inject(NEST_VAULT_CONFIG_OPTIONS) private options: Record<string, any>,
  ) {
    this._nestVaultCache = options?.vaultData;
  }

  get<T>(key: string): T {
    if (this._nestVaultCache) {
      // this.useFallback();
      if (key in this._nestVaultCache) {
        return <T>this._nestVaultCache[key] ?? null;
      }

      const value = this._nestVaultCache[key];
      if (value) {
        return <T>value;
      }
    }
  }

  async useFallback(): Promise<any> {
    const vaultConfig: NestVaultOptions = {
      configPath: this.options.configPath,
      apiVersion: this.options.apiVersion,
      token: this.options.token,
      endpoint: this.options.endpoint,
    };

    const nodeVault = NodeVault(vaultConfig);
    const vaultResponse = await nodeVault.read(vaultConfig.configPath);
    const vaultData = vaultResponse?.data?.data;
    this._nestVaultCache = vaultData;
  }
}
