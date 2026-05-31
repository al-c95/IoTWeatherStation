import { FastifyInstance } from "fastify";
import ThpObservations from "../types/ThpObservations";
import RainObservations from "../types/RainObservations";
import ThpIngestionService from "../ingestion/ThpIngestionService";
import RainIngestionService from "../ingestion/RainIngestionService";
import config from "../../../config/config.json";
import AlertConfig from "../types/AlertConfig";
import temperatureAlertFactory from "../alerts/temperatureAlertFactory";
import TemperatureAlertEngine from "../alerts/TemperatureAlertEngine";

export default async function sensorRoutes(app: FastifyInstance) {
  const alertsConfig = config.alerts as AlertConfig[];

  const thpIngestionService = new ThpIngestionService(
    new TemperatureAlertEngine(
      temperatureAlertFactory(alertsConfig)
    )
  );

  const rainIngestionService = new RainIngestionService();

  app.post("/sensor-data/temperature-humidity-pressure", async (request, reply) => {
    const body = request.body as {
      temperature?: number;
      humidity?: number;
      rawPressure?: number;
      timestampUtc?: number;
    };

    if (typeof body.temperature !== "number") {
      reply.code(400);
      return { error: "temperature missing or invalid" };
    }

    if (typeof body.humidity !== "number") {
      reply.code(400);
      return { error: "humidity missing or invalid" };
    }

    if (body.rawPressure !== undefined && typeof body.rawPressure !== "number") {
      reply.code(400);
      return { error: "raw pressure invalid" };
    }

    if (typeof body.timestampUtc !== "number") {
      reply.code(400);
      return { error: "timestampUtc missing or invalid" };
    }

    const observations: ThpObservations = {
      timestamp: new Date(body.timestampUtc * 1000),
      temperature: body.temperature,
      humidity: body.humidity,
      rawPressure: body.rawPressure ?? 1000,
    };

    await thpIngestionService.execute(observations);

    return { status: "success" };
  });

  app.post("/sensor-data/rain", async (request, reply) => {
    const body = request.body as {
      timestampUtc?: number;
      tips?: {
        timestampUtc?: number;
      }[];
    };

    if (typeof body.timestampUtc !== "number") {
      reply.code(400);
      return { error: "timestampUtc missing or invalid" };
    }

    if (!Array.isArray(body.tips)) {
      reply.code(400);
      return { error: "tips missing or invalid" };
    }

    for (const tip of body.tips) {
      if (typeof tip.timestampUtc !== "number") {
        reply.code(400);
        return { error: "tip timestampUtc missing or invalid" };
      }
    }

    const observations: RainObservations = {
      timestamp: new Date(body.timestampUtc * 1000),
      tips: body.tips.map((tip) => ({
        timestamp: new Date(tip.timestampUtc! * 1000),
      })),
    };

    await rainIngestionService.execute(observations);

    return { status: "success" };
  });
}