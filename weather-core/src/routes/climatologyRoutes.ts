import { FastifyInstance } from "fastify";
import { getYearToDateSummary, getMonthlyAlmanac } from "../db";
import { getCurrentTimestamp } from "../utils";

export default async function climatologyRoutes(app: FastifyInstance) {
  app.get("/climatology/year-to-date", async () => {
    const now = getCurrentTimestamp();
    return getYearToDateSummary(now.getFullYear());
  });

  app.get("/climatology/monthly-almanac", async () => {
    const now = getCurrentTimestamp();
    return getMonthlyAlmanac(now.getFullYear(), now.getMonth() + 1);
  });
}