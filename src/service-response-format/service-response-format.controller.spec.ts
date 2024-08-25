import { Test, TestingModule } from '@nestjs/testing';
import { ServiceResponseFormatController } from './service-response-format.controller';

describe('ServiceResponseFormatController', () => {
  let controller: ServiceResponseFormatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceResponseFormatController],
    }).compile();

    controller = module.get<ServiceResponseFormatController>(ServiceResponseFormatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
