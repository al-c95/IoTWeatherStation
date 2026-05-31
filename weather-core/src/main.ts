import Fastify from "fastify";
import { hydrateCurrentState } from "./currentConditions/currentData";
import sensorRoutes from "./routes/sensorRoutes";
import sseRoutes from "./routes/sseRoutes";
import dailyWeatherRoutes from "./routes/dailyWeatherRoutes";
import exportRoutes from "./routes/exportRoutes";
import climatologyRoutes from "./routes/climatologyRoutes";

const app = Fastify({ logger: true });

console.log("weather-core running...");

hydrateCurrentState();

app.register(sensorRoutes);
app.register(sseRoutes);
app.register(dailyWeatherRoutes);
app.register(exportRoutes);
app.register(climatologyRoutes);

app.listen({
  port: 3000,
  host: "0.0.0.0",
});