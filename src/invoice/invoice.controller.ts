import { Controller,Post,Body } from "@nestjs/common";
import { InvoiceService } from "./invoice.service";
@Controller("invoice")
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}
  
@Post("gst-backfill")
async migrateInvoiceGST(@Body() body: any) {
  try {
    return await this.invoiceService.migrateInvoiceGST();
  } catch (err) {
    return err;
  }
}  
}
