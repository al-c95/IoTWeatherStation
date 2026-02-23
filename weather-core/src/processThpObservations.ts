import { persistObservations } from "./db";
import { getCurrentObservations, updateCurrentThpObservations, retrieveCurrentTemperatureExtrema, getSseUpdateData } from "./currentData";
import ThpObservations from "./types/ThpObservations";
import { Temperature, Humidity, Pressure } from "./types/DailyWeather";
import { broadcastSseEvent } from "./sseBroadcaster";
import TemperatureAlertEngine from "./alerts/TemperatureAlertEngine";
import config from "../../config/config.json";
import AlertConfig from "./types/AlertConfig";

const alertsConfig = config.alerts as AlertConfig[];
const temperatureAlertManager: TemperatureAlertEngine = new TemperatureAlertEngine(alertsConfig);

async function processThpObservations(
  observations: ThpObservations,
  persistFunction: (timestamp: Date,
    temperature: Temperature,
    humidity: Humidity,
    mslPressure: Pressure) => void = persistObservations)
{
    updateCurrentThpObservations(observations);
    persistFunction(observations.timestamp, 
        getCurrentObservations().temp, 
        getCurrentObservations().humidity, 
        getCurrentObservations().mslPressure);
    retrieveCurrentTemperatureExtrema();
    broadcastSseEvent(getSseUpdateData());

    await temperatureAlertManager.processObservations(observations);
}

export default processThpObservations;