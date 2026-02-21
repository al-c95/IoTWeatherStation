import { persistObservations } from "./db";
import { getCurrentObservations, updateCurrentThpObservations, retrieveCurrentTemperatureExtrema, getSseUpdateData } from "./currentData";
import ThpObservations from "./types/ThpObservations";
import { Temperature, Humidity, Pressure } from "./types/DailyWeather";
import { broadcastSseEvent } from "./sseBroadcaster";

function processThpObservations(
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
}

export default processThpObservations;