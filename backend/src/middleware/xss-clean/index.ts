import { clean } from "@/middleware/xss-clean/xss.js";
import { type Request, type Response, type NextFunction } from "express";

export default function xssSanitize() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.body) req.body = clean(req.body);

    if (req.query && Object.keys(req.query).length > 0) {
      const cleanedquery = clean(req.query);
      for (const key in cleanedquery) {
        (req.query as Record<string, unknown>)[key] = cleanedquery[key];
      }
    }

    if (req.params && Object.keys(req.params).length > 0) {
      const cleanedparams = clean(req.params);
      for (const key in cleanedparams) {
        (req.query as Record<string, unknown>)[key] = cleanedparams[key];
      }
    }

    next();
  };
}
