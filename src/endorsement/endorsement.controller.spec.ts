import { Test, TestingModule } from '@nestjs/testing';
import { EndorsementController } from './endorsement.controller';

describe('EndorsementController', () => {
  let controller: EndorsementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EndorsementController],
    }).compile();

    controller = module.get<EndorsementController>(EndorsementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
