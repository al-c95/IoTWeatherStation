import { FastifyInstance } from "fastify";
import { addSseClient, removeSseClient } from "../sseBroadcaster";
import { getSseUpdateData } from "../currentConditions/currentData";

export default async function sseRoutes(app: FastifyInstance) {
  app.get("/update-events-sse", (request, reply) => {
    const response = reply.raw;

    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    response.write(`data: ${JSON.stringify(getSseUpdateData())}\n\n`);

    addSseClient(response);

    request.raw.on("close", () => {
      removeSseClient(response);
    });
  });
}