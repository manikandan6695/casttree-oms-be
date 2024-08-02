// import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
// import { SharedService } from "src/shared/shared.service";
// import { AuthService } from "./auth.service";
// import { Response } from "express";

// @Controller("auth")
// export class AuthController {
//   constructor(
//     private readonly auth_service: AuthService,
//     private readonly shared_service: SharedService
//   ) {}

//   @Post("get-profile-by-organization")
//   async getProfileByOrganization(@Body() body: any, @Res() res: Response) {
//     try {
//       let data = await this.auth_service.getProfileByOrganization(
//         body.organization_id
//       );
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = this.shared_service.processError(
//         err,
//         this.constructor.name,
//         res["req"]
//       );
//       return res.status(code).json(response);
//     }
//   }

//   @Post("get-profile-datas-by-organization")
//   async getProfileDatasByOrganization(@Body() body: any, @Res() res: Response) {
//     try {
//       let data = await this.auth_service.getProfileDatasByOrganization(
//         body.organization_id
//       );
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = this.shared_service.processError(
//         err,
//         this.constructor.name,
//         res["req"]
//       );
//       return res.status(code).json(response);
//     }
//   }

//   @Post("get-org-detail-by-name")
//   async getOrgDetailByName(@Body() body: any, @Res() res: Response) {
//     try {
//       let data = await this.auth_service.getOrgDetailByName(
//         body.organization_portal_name,
//         body.user_id
//       );
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = this.shared_service.processError(
//         err,
//         this.constructor.name,
//         res["req"]
//       );
//       return res.status(code).json(response);
//     }
//   }

//   @Post("get-org-detail-by-realm")
//   async getOrgDetailByRealm(@Body() body: any, @Res() res: Response) {
//     try {
//       let data = await this.auth_service.getOrgDetailByRealm(
//         body.realm_identifier,
//         body.user_id
//       );
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = this.shared_service.processError(
//         err,
//         this.constructor.name,
//         res["req"]
//       );
//       return res.status(code).json(response);
//     }
//   }

//   @Post("get-organization-configuration")
//   async getOrganizationConfiguration(@Body() body: any, @Res() res: Response) {
//     try {
//       let data = await this.auth_service.getOrganizationConfiguration(
//         body.organization_id
//       );
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = this.shared_service.processError(
//         err,
//         this.constructor.name,
//         res["req"]
//       );
//       return res.status(code).json(response);
//     }
//   }
//   @Post("get-user-configuration")
//   async getUserData(@Body() body: any, @Res() res: Response) {
//     try {
//       let data = await this.auth_service.getUserData(
//         body.registry_user_id,
//         body.realm_identifier
//       );
//       return res.json(data);
//     } catch (err) {
//       const { code, response } = this.shared_service.processError(
//         err,
//         this.constructor.name,
//         res["req"]
//       );
//       return res.status(code).json(response);
//     }
//   }
// }
