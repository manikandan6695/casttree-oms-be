import { Test, TestingModule } from "@nestjs/testing";
import { NestVaultService } from "./nest-vault.service";

describe("NestVaultService", () => {
  let service: NestVaultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NestVaultService],
    }).compile();

    service = module.get<NestVaultService>(NestVaultService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
