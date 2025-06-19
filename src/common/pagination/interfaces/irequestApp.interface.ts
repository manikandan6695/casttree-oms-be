import { RequestPaginationSerialization } from "../serializations/request.pagination.serialization";

export interface IRequestApp extends Request {
  apiKey?: unknown;
  user?: unknown;

  __id: string;
  __xTimestamp?: number;
  __timestamp: number;
  __timezone: string;
  __customLang: string[];
  __xCustomLang: string;
  __version: string;
  __repoVersion: string;
  __userAgent: unknown;

  __class?: string;
  __function?: string;

  __pagination?: RequestPaginationSerialization;
}
