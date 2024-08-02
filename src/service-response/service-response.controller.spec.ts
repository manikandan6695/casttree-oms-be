import { Test, TestingModule } from '@nestjs/testing';
import { ServiceResponseController } from './service-response.controller';

describe('ServiceResponseController', () => {
  let controller: ServiceResponseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceResponseController],
    }).compile();

    controller = module.get<ServiceResponseController>(ServiceResponseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
