import { rateLimit } from "express-rate-limit";

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // 100 req per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable legacy rate limit headers
  ipv6Subnet: 56,
});

export default rateLimiter;
