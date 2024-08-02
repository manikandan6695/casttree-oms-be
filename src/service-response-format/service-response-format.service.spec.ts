import { Test, TestingModule } from '@nestjs/testing';
import { ServiceResponseFormatService } from './service-response-format.service';

describe('ServiceResponseFormatService', () => {
  let service: ServiceResponseFormatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceResponseFormatService],
    }).compile();

    service = module.get<ServiceResponseFormatService>(ServiceResponseFormatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
