import { FastifyInstance } from "fastify";
import { createExportWorkbook } from "../Excel";

export default async function exportRoutes(app: FastifyInstance) {
  app.get("/daily-observations/export/xlsx", async (request, reply) => {
    const query = request.query as {
      year?: string;
      month?: string;
    };

    const year = Number(query.year);
    const month = Number(query.month);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      reply.code(400);
      return { error: "year and month are required (month must be 1–12)" };
    }

    const buffer = await createExportWorkbook(year, month);

    const filename = `daily-weather-${year}-${String(month).padStart(2, "0")}.xlsx`;

    reply
      .header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(buffer);
  });
}