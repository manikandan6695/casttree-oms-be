import { Module, Global } from "@nestjs/common";
import { TrinoService } from "./trino.service";
import { NestVaultModule } from "../../nest-vault/nest-vault.module";
import { NestVaultService } from "../../nest-vault/nest-vault.service";
@Global()
@Module({
  imports: [NestVaultModule],
  providers: [
    TrinoService,
    {
      provide: "TRINO_CREDENTIALS",
      useFactory: (vaultService: NestVaultService) => {
        const response = vaultService.get<any>("TRINO_DB_CREDS");
        return {
          server: response.host,
          catalog: response.catalog,
          auth: {
            user: response.user,
            password: response.password,
          },
        };
      },
      inject: [NestVaultService],
    },
  ],
  exports: [TrinoService],
})
export class TrinoModule {}
