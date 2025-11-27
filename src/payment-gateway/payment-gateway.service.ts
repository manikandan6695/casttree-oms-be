import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IPaymentGatewayConfigurationModel } from "./schema/payment-gateway-configuration.schema";
import {
  InstrumentsResponseDto,
  InstrumentDto,
} from "./dto/payment-gateway.dto";
import { EStatus } from "src/process/enums/process.enum";

@Injectable()
export class PaymentGatewayService {
  constructor(
    @InjectModel("paymentGatewayConfiguration")
    private readonly paymentConfigModel: Model<IPaymentGatewayConfigurationModel>
  ) {}

  async getSupportedInstruments(
    paymentType: string,
    device: string
  ): Promise<InstrumentsResponseDto> {
    // Validate
    if (!["payments", "subscription"].includes(paymentType)) {
      throw new BadRequestException("Invalid paymentType");
    }

    if (!["android", "ios", "web"].includes(device)) {
      throw new BadRequestException("Invalid device");
    }

    // Get distinct instruments
    const configs = await this.paymentConfigModel
      .find({
        paymentType,
        device,
        status: EStatus.Active,
      })
      .sort({ sortOrder: 1 })
      .lean();

    const groupedByInstrument = {};

    // Group records by instrument
    for (const config of configs) {
      if (!groupedByInstrument[config.instrument]) {
        groupedByInstrument[config.instrument] = [];
      }
      groupedByInstrument[config.instrument].push(config);
    }

    const result: InstrumentDto[] = [];

    for (const instrumentId in groupedByInstrument) {
      const gateways = groupedByInstrument[instrumentId];

      const isAnyHealthy = gateways.some((g) => g.isHealthy);

      const metadata = gateways[0];

      result.push({
        id: instrumentId,
        displayName: metadata.displayName,
        imageUrl: metadata.imageUrl,
        available: true,
        status: isAnyHealthy ? "healthy" : "Currently facing issues",
      });
    }

    return {
      paymentType,
      device,
      instruments: result,
    };
  }

  async getBestGatewayForInstrument(
    paymentType: string,
    device: string,
    instrument: string
  ): Promise<{ gateway: string; reason: string; warning?: boolean }> {
    // Validate
    if (!["payments", "subscription"].includes(paymentType)) {
      throw new BadRequestException("Invalid paymentType");
    }

    if (!["android", "ios", "web"].includes(device)) {
      throw new BadRequestException("Invalid device");
    }

    // Try to find healthy and active gateways
    const healthyGateways = await this.paymentConfigModel
      .find({
        paymentType,
        device,
        instrument,
        status: "Active",
        isHealthy: true,
      })
      .sort({ priority: 1 })
      .limit(1)
      .lean()
      .exec();

    if (healthyGateways.length > 0) {
      return {
        gateway: healthyGateways[0].gateway,
        reason: "Selected based on priority and health",
      };
    }

    // Fallback: Find any active gateway (ignore health)
    const anyActiveGateway = await this.paymentConfigModel
      .find({
        paymentType,
        device,
        instrument,
        status: "Active",
      })
      .sort({ priority: 1 })
      .limit(1)
      .lean()
      .exec();

    if (anyActiveGateway.length > 0) {
      return {
        gateway: anyActiveGateway[0].gateway,
        reason: "WARNING: All active gateways are currently unhealthy",
        warning: true,
      };
    }

    // No active gateways configured
    throw new NotFoundException(
      `No active gateways configured for ${instrument} on ${device} (${paymentType})`
    );
  }
}

