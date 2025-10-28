import express, { type Router, type Request, type Response, type NextFunction } from "express";
import httpStatus from "http-status";

const router: Router = express.Router();

router.get("/", (_req: Request, res: Response, _next: NextFunction) => {
  res.status(200).json({
    status: httpStatus.OK,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
