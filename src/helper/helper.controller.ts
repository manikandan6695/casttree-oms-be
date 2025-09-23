import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Inject,
  forwardRef,
  Query,
  Res
} from "@nestjs/common";
import { GetBannerDto, BannerResponseDto } from "./dto/getBanner.dto";
import { Response } from "express";
import { ConfigService } from "@nestjs/config";
import { SharedService } from "src/shared/shared.service";
import { HelperService } from "./helper.service";
import { MixpanelExportDto } from "./dto/mixpanel-export.dto";

@Controller("helper")
export class HelperController {
  constructor(
    private sservice: SharedService,
    private helperService: HelperService,
    private configService: ConfigService
  ) {}
  @Post("sendMail")
  async getPlatformItem(@Body() body) {
    try {
      let data = await this.helperService.sendMail(body);
      return data;
    } catch (err) {
      return err;
    }
  }

  @Post("sendWhatsappMessage")
  async sendWhastappMessage(@Body() body) {
    try {
      let data = await this.helperService.sendWhastappMessage(body);
      return data;
    } catch (err) {
      return err;
    }
  }

  @Get("banner/:userId")
  async getBannerToShow(@Param("userId") userId: string,@Param("skillId") skillId: string, @Query("componentKey") componentKey: string, @Query("skillType") skillType: string): Promise<BannerResponseDto> {
    try {
      const data = await this.helperService.getBannerToShow(userId,skillId,skillType,componentKey);
      return data;
    } catch (err) {
      throw err;
    }
}
  @Get("mixpanel/export")
  async exportMixpanelData(@Query() query: any, @Res() res?: Response) {
    try {
      // For large datasets, use streaming approach directly
      if (res) {
        // Set response headers for download
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="mixpanel_export.csv"'
        );
        res.setHeader("Transfer-Encoding", "chunked");

        // Use streaming method directly
        await this.helperService.streamMixpanelToCsv(
          query.fromDate,
          query.toDate,
          query.event,
          query.limit,
          res
        );
      } else {
        // For non-streaming requests, try the regular method but with a limit
        const csv = await this.helperService.exportMixpanelToCsv(
          query.fromDate,
          query.toDate,
          query.event,
          query.limit || 10000 // Default limit for non-streaming
        );
        return { csv };
      }
    } catch (err) {
      console.error("Error exporting Mixpanel data:", err);
      if (res) {
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to export Mixpanel data" });
        }
      } else {
        return { error: "Failed to export Mixpanel data" };
      }
    }
  }

  @Get("mixpanel/data")
  async getMixpanelData(@Query() query: any) {
    try {
      const jsonlData = await this.helperService.fetchMixpanelData(
        query.fromDate,
        query.toDate,
        query.event,
        query.limit
      );
      return { data: jsonlData };
    } catch (err) {
      console.error("Error fetching Mixpanel data:", err);
      return { error: "Failed to fetch Mixpanel data" };
    }
  }

  @Get("mixpanel/stream-export")
  async streamMixpanelExport(@Query() query: any, @Res() res: Response) {
    try {
      const mixpanelApiSecret = this.configService.get("MIXPANEL_API_SECRET");
      
      if (!mixpanelApiSecret) {
        return res.status(500).json({ error: "MIXPANEL_API_SECRET not configured" });
      }

      // Set response headers for streaming CSV
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="mixpanel_export.csv"');
      res.setHeader("Transfer-Encoding", "chunked");

      // Use the streaming method directly
      await this.helperService.streamMixpanelToCsv(
        query.fromDate,
        query.toDate,
        query.event,
        query.limit,
        res
      );
    } catch (err) {
      console.error("Error streaming Mixpanel data:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream Mixpanel data" });
      }
    }
  }
}
