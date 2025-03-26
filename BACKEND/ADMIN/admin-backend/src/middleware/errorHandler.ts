import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errors";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error("Error:", err.message);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  return res.status(500).json({ error: "Internal Server Error" });
};