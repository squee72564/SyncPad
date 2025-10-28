import express, { type Router } from "express";
import { toNodeHandler } from "better-auth/node";
import auth from "../../lib/auth.js";

const router: Router = express.Router();

router.all("/auth/{*any}", toNodeHandler(auth));

export default router;
