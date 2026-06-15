import type { FastifyInstance } from "fastify";

import { buildReport } from "../../db/memoryStore.js";

export async function registerReportRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/api/sessions/:id/report", async (request, reply) => {
    const report = buildReport(request.params.id);
    if (!report) {
      return reply.code(404).send({ message: "Session not found" });
    }

    return report;
  });
}
