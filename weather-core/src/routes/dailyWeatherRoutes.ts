import { FastifyInstance } from "fastify";
import { getDailyWeatherLastNDays } from "../db";

export default async function dailyWeatherRoutes(app: FastifyInstance) {
  app.get("/daily-observations", async (request, reply) => {
    const query = request.query as { days?: string };
    const days = Number(query.days ?? 7);

    if (!Number.isInteger(days) || days < 1 || days > 365) {
      reply.code(400);
      return { error: "days must be an integer between 1 and 365" };
    }

    const data = getDailyWeatherLastNDays(days);

    return { days, data };
  });
}