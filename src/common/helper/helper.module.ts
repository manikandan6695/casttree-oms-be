import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { HelperArrayService } from "./services/helper.array.service";
import { HelperDateService } from "./services/helper.date.service";
import { HelperEncryptionService } from "./services/helper.encryption.service";
import { HelperHashService } from "./services/helper.hash.service";
import { HelperNumberService } from "./services/helper.number.service";
import { HelperStringService } from "./services/helper.string.service";
import { HelperFileService } from "./services/helper.file.service";
import { HelperGoogleService } from "./services/helper.google.service";
import { NestVaultModule } from "../nest-vault/nest-vault.module";
import { NestVaultService } from "../nest-vault/nest-vault.service";

@Global()
@Module({
  providers: [
    HelperArrayService,
    HelperDateService,
    HelperEncryptionService,
    HelperHashService,
    HelperNumberService,
    HelperStringService,
    HelperFileService,
    HelperGoogleService,
  ],
  exports: [
    HelperArrayService,
    HelperDateService,
    HelperEncryptionService,
    HelperHashService,
    HelperNumberService,
    HelperStringService,
    HelperFileService,
    HelperGoogleService,
  ],
  controllers: [],
  imports: [
    JwtModule.registerAsync({
      inject: [NestVaultService],
      imports: [NestVaultModule],
      useFactory: (configService: NestVaultService) => ({
        secret: configService.get<string>("helper.jwt.defaultSecretKey"),
        signOptions: {
          expiresIn: configService.get<string>(
            "helper.jwt.defaultExpirationTime",
          ),
        },
      }),
    }),
  ],
})
export class HelperModule {}
