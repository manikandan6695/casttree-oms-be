import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as bodyParser from "body-parser";
import "dotenv/config";
import helmet from "helmet";
import { AppModule } from "./app.module";

const port = process.env.SERVER_PORT || 3001;
const extractor = (request: Request): string | string[] => {
  return [request.headers["x-api-version"] ?? "1"]
    .flatMap((v: any) => v.split(","))
    .filter((v) => !!v)
    .sort()
    .reverse();
};
let cors = process.env.CORS_ALLOWED_HEADERS.split(",").map((h) =>
  h.trim().toLowerCase()
);
console.log("cors", cors);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      preflightContinue: false,
      optionsSuccessStatus: 200,
      origin: JSON.parse(process.env.CORS_ALLOWED_ORIGIN),
      credentials: true,
      allowedHeaders: process.env.CORS_ALLOWED_HEADERS.split(",").map((h) =>
        h.trim().toLowerCase()
      ),
      methods: process.env.CORS_ALLOWED_METHODS,
    },
  });
  app.enableCors();
  app.use(helmet());
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
  app.setGlobalPrefix(process.env.API_PREFIX);
  app.enableVersioning({
    type: VersioningType.CUSTOM,
    extractor,
    defaultVersion: "1",
  });
  await app.listen(port);
  console.log(`${new Date()}====>App started in port ${port}<====`);
}
bootstrap();
