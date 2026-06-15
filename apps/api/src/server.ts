import Fastify from "fastify";
import cors from "@fastify/cors";
import { pathToFileURL } from "node:url";

import { registerAdminRoutes } from "./modules/admin/routes.js";
import { registerReportRoutes } from "./modules/reports/routes.js";
import { registerSessionRoutes } from "./modules/sessions/routes.js";
import { registerUserRoutes } from "./modules/users/routes.js";

export function buildServer(options: { logger?: boolean } = {}) {
  const app = Fastify({ logger: options.logger ?? true });

  void app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"]
  });

  app.get("/health", async () => ({ status: "ok", service: "run-chat-api" }));

  void registerUserRoutes(app);
  void registerSessionRoutes(app);
  void registerReportRoutes(app);
  void registerAdminRoutes(app);

  return app;
}

const shouldStartServer = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (shouldStartServer) {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? "127.0.0.1";

  app.listen({ port, host }).catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
}
