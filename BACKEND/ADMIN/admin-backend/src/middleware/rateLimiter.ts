import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window per IP
  message: { error: "Too many requests, please try again later." },
  headers: true,
});

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 login attempts per window per IP
  message: { error: "Too many login attempts, please try again later." },
  headers: true,
});