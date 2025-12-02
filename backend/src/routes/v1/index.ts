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
import aiJobRoute from "./ai-job.route.ts";
import documentEmbeddingRoute from "./document-embedding.route.ts";
import aiChatMessageRoute from "./ai-chat-messages.route.ts";
import aiChatThreadsRoute from "./ai-chat-threads.route.ts";

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
    path: "/workspaces/:workspaceId/document-embeddings",
    route: documentEmbeddingRoute,
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
  {
    path: "/workspaces/:workspaceId/ai-jobs",
    route: aiJobRoute,
  },
  {
    path: "/workspaces/:workspaceId/thread",
    route: aiChatThreadsRoute,
  },
  {
    path: "/workspaces/:workspaceId/thread/:threadId",
    route: aiChatMessageRoute,
  },
] as { path: string; route: Router }[];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default {
  default: router,
  authRoute: authRoute, // Export authRoute separately so we can use it before express.json() middleware in src/app.ts
};
