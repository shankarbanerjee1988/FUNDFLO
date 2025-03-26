import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import securityMiddleware from "./middleware/security";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import moduleRoutes from "./fundflo/module/module.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(securityMiddleware);
app.use(apiLimiter);

  

// Feature Routes
app.use("/api/modules", moduleRoutes);

// Error Handling Middleware
// app.use(errorHandler);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
  });

export default app;