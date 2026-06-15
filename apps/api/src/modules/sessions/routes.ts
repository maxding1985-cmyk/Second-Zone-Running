import type { FastifyInstance } from "fastify";

import type { CoachStyle, PostRunFeedback, RunEventType, RunExitReason, RunMode, SessionStatus } from "@run-chat/shared";
import { addEvent, createSession, getSession, savePostRunFeedback, updateSession } from "../../db/memoryStore.js";

type CreateSessionBody = {
  userId?: string;
  mode?: RunMode;
  coachStyle?: CoachStyle;
};

type UpdateSessionBody = {
  status?: SessionStatus;
  durationSec?: number;
  exitReason?: RunExitReason;
};

type CreateEventBody = {
  type?: RunEventType;
  payload?: Record<string, unknown>;
};

export async function registerSessionRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateSessionBody }>("/api/sessions", async (request, reply) => {
    const session = createSession({
      userId: request.body.userId,
      mode: request.body.mode ?? "after_work_reset",
      coachStyle: request.body.coachStyle ?? "gentle"
    });

    return reply.code(201).send(session);
  });

  app.get<{ Params: { id: string } }>("/api/sessions/:id", async (request, reply) => {
    const session = getSession(request.params.id);
    if (!session) {
      return reply.code(404).send({ message: "Session not found" });
    }

    return session;
  });

  app.patch<{ Params: { id: string }; Body: UpdateSessionBody }>("/api/sessions/:id", async (request, reply) => {
    const endedAt = request.body.status === "completed" || request.body.status === "abandoned" ? new Date().toISOString() : undefined;
    const session = updateSession(request.params.id, {
      status: request.body.status,
      durationSec: request.body.durationSec,
      endedAt,
      exitReason: request.body.exitReason
    });

    if (!session) {
      return reply.code(404).send({ message: "Session not found" });
    }

    return session;
  });

  app.post<{ Params: { id: string }; Body: CreateEventBody }>("/api/sessions/:id/events", async (request, reply) => {
    if (!request.body.type) {
      return reply.code(400).send({ message: "Event type is required" });
    }

    const event = addEvent(request.params.id, {
      type: request.body.type,
      payload: request.body.payload
    });

    if (!event) {
      return reply.code(404).send({ message: "Session not found" });
    }

    return reply.code(201).send(event);
  });

  app.post<{ Params: { id: string }; Body: PostRunFeedback }>("/api/sessions/:id/feedback", async (request, reply) => {
    const feedback = savePostRunFeedback(request.params.id, request.body);
    if (!feedback) {
      return reply.code(404).send({ message: "Session not found" });
    }

    return reply.code(201).send(feedback);
  });
}
