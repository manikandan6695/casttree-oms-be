import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PaymentWebhookMiddleware implements NestMiddleware {
    constructor(private readonly configService: ConfigService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            const { currency, amount } = req.body;

            if (currency && amount && currency !== "INR") {
                try {
                    const apiKey = "6f1e3f68adcb42ad9ad8520ba173f1e2";
                    const response = await axios.get(
                        `https://openexchangerates.org/api/latest.json?app_id=${apiKey}`
                    );
                    if (response.data?.rates?.["INR"]) {
                        let amt = req.body.amountInINR = amount * response.data.rates["INR"];
                        console.log(amt);

                        return amt;
                    } else {
                        console.error("Invalid conversion response, using original amount");
                        req.body.amountInINR = amount;
                    }
                } catch (error) {
                    console.error("Error fetching exchange rate:", error.message);
                    req.body.amountInINR = amount;
                }
            } else {
                req.body.amountInINR = amount;
            }

            next();
        } catch (error) {
            console.error("Middleware error:", error.message);
            next(error);
        }
    }
}
