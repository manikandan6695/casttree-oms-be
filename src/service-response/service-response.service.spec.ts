import { Test, TestingModule } from '@nestjs/testing';
import { ServiceResponseService } from './service-response.service';

describe('ServiceResponseService', () => {
  let service: ServiceResponseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceResponseService],
    }).compile();

    service = module.get<ServiceResponseService>(ServiceResponseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
