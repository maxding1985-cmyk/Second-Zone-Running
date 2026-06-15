import type { FastifyInstance } from "fastify";

import { createAnonymousUser, getUser } from "../../db/memoryStore.js";

type CreateAnonymousUserBody = {
  nickname?: string;
  testerGroup?: string;
};

export async function registerUserRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateAnonymousUserBody }>("/api/users/anonymous", async (request, reply) => {
    const user = createAnonymousUser({
      nickname: request.body?.nickname,
      testerGroup: request.body?.testerGroup
    });

    return reply.code(201).send(user);
  });

  app.get<{ Params: { id: string } }>("/api/users/:id", async (request, reply) => {
    const user = getUser(request.params.id);
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }

    return user;
  });
}
