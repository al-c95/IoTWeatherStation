import Fastify from "fastify";
import { addSseClient, removeSseClient } from "./sseBroadcaster";
import { getDailyWeatherLastNDays, getYearToDateSummary, getMonthlyAlmanac } from "./db";
import { createExportWorkbook } from "./Excel";
import { getSseUpdateData, retrieveCurrentTemperatureExtrema } from "./currentData";
import { getCurrentTimestamp } from "./utils";
import ThpObservations from "./types/ThpObservations";
import ThpIngestionService from "./ThpIngestionService";

const app = Fastify({logger: true});

console.log("weather-core running...");

retrieveCurrentTemperatureExtrema();

const thpIngestionService: ThpIngestionService = new ThpIngestionService();

app.post("/sensor-data/temperature-humidity-pressure", async (request, reply) => {

    const now = getCurrentTimestamp();

    const body = request.body as {
      temperature?: number;
      humidity?: number;
      rawPressure?: number;
    };
    const currentTemperature = body.temperature;
    const currentHumidity = body.humidity;
    const currentRawPressure = body.rawPressure;

    if (typeof currentTemperature !== 'number')
    {
      reply.code(400);

      return { error: "temperature missing or invalid"};
    }

    if (typeof currentHumidity !== 'number')
    {
      reply.code(400);

      return { error: "humidity missing or invalid"};
    }

    if (typeof currentRawPressure !== 'number')
    {
      reply.code(400);

      return { error: "raw pressure missing or invalid"};
    }

    const observations: ThpObservations = {
      timestamp: now,
      temperature: currentTemperature,
      humidity: currentHumidity,
      rawPressure: currentRawPressure
    }
    await thpIngestionService.execute(observations);

    return { status: "success" };
});

app.get("/daily-observations", async (request, reply) => {
  const query = request.query as { days?: string };
  const days = Number(query.days ?? 7);

  if (!Number.isInteger(days) || days < 1 || days > 365)
  {
    reply.code(400);

    return { error: "days must be an integer between 1 and 365" };
  }

  const data = getDailyWeatherLastNDays(days);

  return { days, data };
});

app.get("/update-events-sse", (request, reply) => {
  const response = reply.raw;

  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });

  response.write(`data: ${JSON.stringify(getSseUpdateData())}\n\n`);

  addSseClient(response);

  request.raw.on("close", () => {
    removeSseClient(response);
  });
});

app.get("/daily-observations/export/xlsx", async (request, reply) => {
  const query = request.query as {
    year?: string;
    month?: string;
  };

  const year = Number(query.year);
  const month = Number(query.month);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12)
  {
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

app.get("/climatology/year-to-date", async (request, reply) => {
  const now = getCurrentTimestamp();

  return getYearToDateSummary(now.getFullYear());
});

app.get("/climatology/monthly-almanac", async (request, reply) => {
  const now = getCurrentTimestamp();

  return getMonthlyAlmanac(now.getFullYear(), now.getMonth()+1);
});

app.listen({ port: 3000 });