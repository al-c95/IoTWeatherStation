import { persistObservations } from "./db";
import { getCurrentObservations, updateCurrentObservations, retrieveCurrentTemperatureExtrema } from "./currentData";
import ThpObservations from "./types/ThpObservations";

export type Temperature = number | null;
export type Humidity = number | null;
export type NullableDate = Date | null;
export type Precipitation = number | null;
export type Pressure = number | null;

export function processThpObservations(
  observations: ThpObservations,
  persistFunction: (timestamp: Date,
    temperature: Temperature,
    humidity: Humidity,
    mslPressure: Pressure) => void = persistObservations)
{
    updateCurrentObservations(
        observations.temperature, 
        observations.humidity, 
        observations.rawPressure, 
        observations.timestamp);

    persistFunction(observations.timestamp, 
        getCurrentObservations().temp, 
        getCurrentObservations().humidity, 
        getCurrentObservations().mslPressure);

    retrieveCurrentTemperatureExtrema();
}

export interface DailyWeather
{
    day: number;
    month: number;
    year: number;
    minTemp: Temperature;
    maxTemp: Temperature;
    precipitation: Precipitation;
}