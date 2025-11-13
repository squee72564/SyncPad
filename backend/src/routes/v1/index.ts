import express, { type Router } from "express";
import healthRoute from "./health.route.js";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import adminRoute from "./admin.route.js";
import workspaceRoute from "./workspace.route.js";
import documentRoute from "./document.route.js";
import shareLinkRoute from "./share-link.route.js";
import shareLinkPublicRoute from "./share-link.public.route.js";
import activityLogRoute from "./activity-log.route.js";

const router: Router = express.Router();

const defaultRoutes = [
  {
    path: "/health",
    route: healthRoute,
  },
  {
    path: "/user",
    route: userRoute,
  },
  {
    path: "/admin",
    route: adminRoute,
  },
  {
    path: "/workspaces",
    route: workspaceRoute,
  },
  {
    path: "/workspaces/:workspaceId/documents",
    route: documentRoute,
  },
  {
    path: "/workspaces/:workspaceId/activity-logs",
    route: activityLogRoute,
  },
  {
    path: "/workspaces/:workspaceId/documents/:documentId/share-links",
    route: shareLinkRoute,
  },
  {
    path: "/share-links",
    route: shareLinkPublicRoute,
  },
] as { path: string; route: Router }[];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default {
  default: router,
  authRoute: authRoute, // Export authRoute separately so we can use it before express.json() middleware in src/app.ts
};
