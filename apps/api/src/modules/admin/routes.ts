import type { FastifyInstance } from "fastify";

import { getExportCsv, getExportData, getMetrics, getSessionExportRows } from "../../db/memoryStore.js";

export async function registerAdminRoutes(app: FastifyInstance) {
  app.get("/api/admin/metrics", async () => getMetrics());
  app.get("/api/admin/sessions", async () => ({ sessions: getSessionExportRows() }));
  app.get("/api/admin/export.json", async () => getExportData());
  app.get("/api/admin/export.csv", async (_request, reply) => {
    return reply.header("content-type", "text/csv; charset=utf-8").send(getExportCsv());
  });
}
