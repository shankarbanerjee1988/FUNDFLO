import { Request, Response, NextFunction } from "express";
import helmet from "helmet";

const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://trusted-scripts.example.com"],
        styleSrc: ["'self'", "https://trusted-styles.example.com"],
        imgSrc: ["'self'", "data:", "https://trusted-images.example.com"],
      },
    },
    frameguard: { action: "deny" }, // Prevents clickjacking attacks
    xssFilter: true, // Adds X-XSS-Protection header
    hidePoweredBy: true, // Removes "X-Powered-By" header
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // Enforces HTTPS
    noSniff: true, // Prevents MIME type sniffing
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }, // Controls referrer information
  })(req, res, next);
};

export default securityMiddleware;