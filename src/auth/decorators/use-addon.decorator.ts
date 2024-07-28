import { SetMetadata } from "@nestjs/common";

export const UseAddon = (input: AddonInputModel) =>
  SetMetadata("addonInput", input);

export class AddonInputModel {
  addon_key: any;
  skip_validation?: boolean = false;
}
