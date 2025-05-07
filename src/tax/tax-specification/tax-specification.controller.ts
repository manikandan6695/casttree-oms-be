// import {
//   Controller,
//   Get,
//   Res,
//   UseGuards,
//   UseInterceptors,
// } from "@nestjs/common";
// import { GetOrganization } from "src/auth/decorators/param/get-organization.decorator";
// import { GetOrg } from "src/auth/interceptors/get-org.interceptor";
// import { TaxSpecificationService } from "./tax-specification.service";
// import { Response } from "express";
// import { SharedService } from "src/shared/shared.service";
// import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

// @Controller("tax-specification")
// export class TaxSpecificationController {
//   constructor(
//     private tax_spec_service: TaxSpecificationService,
//     private shared_service: SharedService
//   ) {}

//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(GetOrg)
//   @Get("")
//   async getTaxSpec(
//     @GetOrganization("organization_country")
//     organization_country: string,
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.tax_spec_service.getTaxSpec(organization_country);
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = this.shared_service.processError(
//         err,
//         this.constructor.name
//       );
//       return res.status(code).json(response);
//     }
//   }
// }
