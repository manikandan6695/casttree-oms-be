import { Request, Response, NextFunction } from "express";

export function aesGCMMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.headers["content-encoding"] === "aesgcm") {
    delete req.headers["content-encoding"];
  }
  next();
}
