import { persistObservations } from "./db";
import { getCurrentObservations, updateCurrentObservations, retrieveCurrentTemperatureExtrema } from "./currentData";

export type Temperature = number | null;
export type Humidity = number | null;
export type NullableDate = Date | null;
export type Precipitation = number | null;
export type Pressure = number | null;

export function processTemperatureHumidityAndPressureObservations(
  temperature: number, 
  humidity: number,
  rawPressure: number,
  timestamp: Date,
  persistFunction: (timestamp: Date,
    temperature: Temperature,
    humidity: Humidity,
    mslPressure: Pressure) => void = persistObservations)
{
    updateCurrentObservations(temperature, humidity, rawPressure, timestamp);
    persistFunction(timestamp, 
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