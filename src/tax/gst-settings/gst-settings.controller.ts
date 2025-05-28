// import {
//   Body,
//   Controller,
//   Get,
//   Param,
//   Patch,
//   Post,
//   Res,
//   UseGuards,
//   UseInterceptors,
//   ValidationPipe,
// } from "@nestjs/common";
// import { Response } from "express";
// import { DoAuthorityCheck } from "src/auth/decorators/docheck.decorator";
// import { GetFilters } from "src/auth/decorators/param/get-filter.decorator";
// import { GetOrganization } from "src/auth/decorators/param/get-organization.decorator";
// import { GetProductKey } from "src/auth/decorators/param/get-product-key";
// import { GetReqDetails } from "src/auth/decorators/param/get-request-details";
// import {
//   AttrType,
//   RequestDetails,
// } from "src/auth/decorators/request-details.decorator";
// import {
//   EActionSubType,
//   EActionType,
//   EUserActions,
//   UserActionType,
// } from "src/auth/decorators/user-action.decorator";
// import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
// import { CheckAccess } from "src/auth/interceptors/checkAccess.interceptor";
// import { GetToken } from "src/shared/decorator/getuser.decorator";
// import { SharedService } from "src/shared/shared.service";
// import { UserToken } from "src/user/dto/usertoken.dto";
// import { CreateGSTSettingsDTO } from "./dto/create-gst-settings.dto";
// import { StatusDTO, UpdateGSTSettingsDTO } from "./dto/update-gst-settings.dto";
// import { GstSettingsService } from "./gst-settings.service";

// @Controller("gst-settings")
// export class GstSettingsController {
//   constructor(
//     private sservice: SharedService,
//     private gst_settings_service: GstSettingsService
//   ) {}

//   @DoAuthorityCheck(true)
//   @UserActionType({
//     actionType: EActionType.implicit,
//     action: EUserActions.create,
//     formCode: "GSTSINGS",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Post("create-gst-settings")
//   async createGSTSettings(
//     @GetToken() token: UserToken,
//     @Body(new ValidationPipe({ whitelist: true }))
//     body: CreateGSTSettingsDTO,
//     @GetOrganization("_id") organization_id: string,
//     @GetProductKey("product_key") product_key: string,
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.gst_settings_service.createGSTSettings(
//         token,
//         body,
//         organization_id,
//         product_key
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
//     formCode: "GSTSINGS",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Get("get-gst-settings-list")
//   async getGSTSettingsList(@GetFilters() filters: any, @Res() res: Response) {
//     try {
//       let data = await this.gst_settings_service.getGSTSettingsList(filters);
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
//     formCode: "GSTSINGS",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Get("/:id")
//   async getGSTSettingsDetail(@Param("id") id: string, @Res() res: Response) {
//     try {
//       let data = await this.gst_settings_service.getGSTSettingsDetail(id);
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
//     formCode: "GSTSINGS",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Patch("/:id")
//   async updateGSTSettings(
//     @Param("id") id: string,
//     @GetToken() token: UserToken,
//     @GetOrganization("_id") organization_id: string,
//     @Body(new ValidationPipe({ whitelist: true })) body: UpdateGSTSettingsDTO,
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.gst_settings_service.updateGSTSettings(
//         id,
//         body,
//         token,
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
//     action: EUserActions.edit,
//     formCode: "GSTSINGS",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Patch("mark-as-inactive/:id")
//   async markAsInactive(
//     @Param("id") id: string,
//     @Body(new ValidationPipe({ whitelist: true })) body: StatusDTO,
//     @GetToken() token: UserToken,
//     @GetOrganization("_id") organization_id: string,
//     @GetProductKey("product_key") product_key: string,
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.gst_settings_service.markAsInactive(
//         id,
//         body,
//         token,
//         organization_id,
//         product_key
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
//     formCode: "GSTSINGS",
//   })
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(CheckAccess)
//   @Post("get-initial-data")
//   async getBranchInitialData(
//     @GetOrganization("_id") organization_id: string,
//     @Body() body: any,
//     @Res() res: Response
//   ) {
//     try {
//       let data = await this.gst_settings_service.getBranchInitialData(
//         body,
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
// }
