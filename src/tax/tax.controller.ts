// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Param,
//   ParseIntPipe,
//   Post,
//   Query,
//   Res,
//   Patch,
//   UseGuards,
//   UseInterceptors,
//   ValidationPipe,
// } from "@nestjs/common";
// import {
//   EActionSubType,
//   EActionType,
//   EUserActions,
//   UserActionType,
// } from "src/auth/decorators/user-action.decorator";
// import { Response } from "express";
// import { DoAuthorityCheck } from "src/auth/decorators/docheck.decorator";
// import { GetOrganization } from "src/auth/decorators/param/get-organization.decorator";
// import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
// import { GetToken } from "src/shared/decorator/getuser.decorator";
// import { SharedService } from "src/shared/shared.service";
// import { UserToken } from "src/user/dto/usertoken.dto";
// import { TaxService } from "./tax.service";
// import {
//   AttrType,
//   RequestDetails,
// } from "src/auth/decorators/request-details.decorator";
// import { CheckAccess } from "src/auth/interceptors/checkAccess.interceptor";
// import { CreateTaxDTO } from "./dto/create-tax.dto";
// import { AssociateTaxDTO } from "./dto/associate-tax.dto";
// import { UpdateTaxDTO } from "./dto/update-tax.dto";
// import { GetOrg } from "src/auth/interceptors/get-org.interceptor";

// @Controller("tax")
// export class TaxController {
//   constructor(
//     private sservice: SharedService,
//     private tax_service: TaxService
//   ) {}

//   @Post("add-tax")
//   async addTax(
//     @GetToken() token: UserToken,
//     @GetOrganization("_id") organization_id: string,
//     @Body(new ValidationPipe({ whitelist: true })) body: CreateTaxDTO,
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.tax_service.addTax(body, token, organization_id);
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = await this.sservice.processError(
//         err,
//         this.constructor.name
//       );
//       return res.status(code).json(response);
//     }
//   }
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(GetOrg)
//   @Get("get-specification-tax")
//   async getSpecificationTax(
//     @GetOrganization("_id") organization_id: string,
//     @GetOrganization("organization_country")
//     organization_country: string,
//     @Query("tax_specification_id") tax_specification_id: string[],
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.tax_service.getSpecificationTax(
//         tax_specification_id,
//         organization_id,
//         organization_country
//       );
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = await this.sservice.processError(
//         err,
//         this.constructor.name
//       );
//       return res.status(code).json(response);
//     }
//   }
//   @DoAuthorityCheck(true)
//   @UserActionType({
//     actionType: EActionType.implicit,
//     action: EUserActions.view,
//     formCode: "TAX",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Get("get-tax-list")
//   async getTaxList(
//     @GetOrganization("_id") organization_id: string,
//     @Query("skip", ParseIntPipe) skip: number,
//     @Query("limit", ParseIntPipe) limit: number,
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.tax_service.getTaxList(
//         skip,
//         limit,
//         organization_id
//       );
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = await this.sservice.processError(
//         err,
//         this.constructor.name
//       );
//       return res.status(code).json(response);
//     }
//   }

//   @DoAuthorityCheck(true)
//   @RequestDetails({
//     payloadType: AttrType.param,
//     primaryAttrKey: "id",
//   })
//   @UserActionType({
//     actionType: EActionType.implicit,
//     action: EUserActions.view,
//     actionSubType: EActionSubType.detail,
//     formCode: "TAX",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Get("/:id")
//   async getSingleTax(@Param("id") id: string, @Res() res: Response) {
//     try {
//       let data = await this.tax_service.getSingleTax(id);
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = await this.sservice.processError(
//         err,
//         this.constructor.name
//       );
//       return res.status(code).json(response);
//     }
//   }
//   @DoAuthorityCheck(true)
//   @RequestDetails({
//     payloadType: AttrType.param,
//     primaryAttrKey: "id",
//   })
//   @UserActionType({
//     actionType: EActionType.implicit,
//     action: EUserActions.edit,
//     formCode: "TAX",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Patch("/:id")
//   async updateTax(
//     @Param("id") id: string,
//     @GetOrganization("_id") organization_id: string,
//     @Body(new ValidationPipe({ whitelist: true })) body: UpdateTaxDTO,
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.tax_service.updateTax(id, body, organization_id);
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = await this.sservice.processError(
//         err,
//         this.constructor.name
//       );
//       return res.status(code).json(response);
//     }
//   }

//   @DoAuthorityCheck(true)
//   @RequestDetails({
//     payloadType: AttrType.param,
//     primaryAttrKey: "id",
//   })
//   @UserActionType({
//     actionType: EActionType.implicit,
//     action: EUserActions.delete,
//     formCode: "TAX",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Delete(":id")
//   async deleteTax(@Param("id") id: string, @Res() res: Response) {
//     try {
//       let data = await this.tax_service.deleteTax(id);
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = await this.sservice.processError(
//         err,
//         this.constructor.name
//       );
//       return res.status(code).json(response);
//     }
//   }

//   @DoAuthorityCheck(true)
//   @UserActionType({
//     actionType: EActionType.implicit,
//     action: EUserActions.view,
//     formCode: "TAX",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Post("get-tax-types")
//   async getTaxTypes(
//     @Body() body: any,
//     @GetOrganization("organization_country")
//     organization_country: string,
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.tax_service.getTaxTypes(body, organization_country);
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = await this.sservice.processError(
//         err,
//         this.constructor.name
//       );
//       return res.status(code).json(response);
//     }
//   }

//   @DoAuthorityCheck(true)
//   @UserActionType({
//     actionType: EActionType.implicit,
//     action: EUserActions.view,
//     formCode: "TAX",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Post("get-associate-tax")
//   async getAssociateTax(
//     @Body(new ValidationPipe({ whitelist: true })) body: AssociateTaxDTO,
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.tax_service.getAssociateTax(body);
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = await this.sservice.processError(
//         err,
//         this.constructor.name
//       );
//       return res.status(code).json(response);
//     }
//   }

//   @DoAuthorityCheck(true)
//   @UserActionType({
//     actionType: EActionType.implicit,
//     action: EUserActions.view,
//     formCode: "TAX",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Post("get-taxes")
//   async getTaxes(
//     @GetOrganization("_id") organization_id: string,
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.tax_service.getTaxes(organization_id);
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = await this.sservice.processError(
//         err,
//         this.constructor.name
//       );
//       return res.status(code).json(response);
//     }
//   }
// }
