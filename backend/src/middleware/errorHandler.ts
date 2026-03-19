import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err && typeof err.message === "string"
        ? err.message
        : "Internal server error";

  console.error("[ERROR]", err);
  res.status(500).json({ error: message });
}
