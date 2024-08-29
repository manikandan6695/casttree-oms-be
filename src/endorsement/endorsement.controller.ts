import { Controller } from "@nestjs/common";
import { SharedService } from "src/shared/shared.service";
import { EndorsementService } from "./endorsement.service";

@Controller("endorsement")
export class EndorsementController {
  constructor(
    private readonly endorsementService: EndorsementService,
    private sservice: SharedService
  ) {}
}
