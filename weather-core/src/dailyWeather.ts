import { persistDailyTemperatureExtrema } from "./db";
import { getTemperatureExtrema, updateCurrentObservations, updateTemperatureExtrema } from "./currentData";

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
  persistFunction: (ts: Date, minT: Temperature, maxT: Temperature, minTa: NullableDate, maxTa: NullableDate) => void = persistDailyTemperatureExtrema)
{
    updateCurrentObservations(temperature, humidity, rawPressure, timestamp);

    if (updateTemperatureExtrema(temperature, timestamp))
    {
      persistFunction(timestamp, getTemperatureExtrema().minTemp, getTemperatureExtrema().maxTemp, getTemperatureExtrema().minTempAt, getTemperatureExtrema().maxTempAt);
    }
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