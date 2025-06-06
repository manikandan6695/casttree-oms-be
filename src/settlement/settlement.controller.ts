import { Controller,Get } from '@nestjs/common';
import { SettlementService } from './settlement.service';

@Controller('settlement')
export class SettlementController {
      constructor(private readonly settlementService: SettlementService) {}

  @Get('settlements')
  async getRecentSettlements() {
    return await this.settlementService.fetchRecentSettlements();

  
  }
}
