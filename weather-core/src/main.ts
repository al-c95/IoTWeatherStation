import Fastify from "fastify";
import { addSseClient, broadcastSseEvent, removeSseClient } from "./sseBroadcaster";
import { processTemperatureAndHumidityObservations} from "./dailyWeather";
import { getDailyWeatherLastNDays } from "./db";
import { createExportWorkbook } from "./Excel";
import { getSseUpdateData } from "./currentData";
import { getCurrentTimestamp } from "./utils";
import "./db";

const app = Fastify({logger: true});

console.log("APP RUNNING");

app.post("/sensor-data/temperature-humidity", async (request, reply) => {

    const now = getCurrentTimestamp();

    const body = request.body as {
      temperature?: number;
      humidity?: number;
    };
    const currentTemperature = body.temperature;
    const currentHumidity = body.humidity;

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

    processTemperatureAndHumidityObservations(currentTemperature, currentHumidity, now);

    broadcastSseEvent(getSseUpdateData());

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

app.listen({ port: 3000 });