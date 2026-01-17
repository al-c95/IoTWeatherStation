import { Temperature, Humidity, NullableDate } from "./dailyWeather";

export type CurrentObservations = {
  temp: Temperature;
  humidity: Humidity;
  dewPoint: Temperature;
  timestamp: NullableDate;
};

export type DailyTemperatureExtrema = {
  minTemp: Temperature;
  minTempAt: NullableDate;
  maxTemp: Temperature;
  maxTempAt: NullableDate;
};

export type SseUpdateData = CurrentObservations & DailyTemperatureExtrema;

const currentObservations: CurrentObservations = {
  temp: null,
  humidity: null,
  dewPoint: null,
  timestamp: null
};

export function getCurrentObservations(): Readonly<CurrentObservations>
{
  return {
    temp: currentObservations.temp,
    humidity: currentObservations.humidity,
    dewPoint: currentObservations.dewPoint,
    timestamp: currentObservations.timestamp ? new Date(currentObservations.timestamp) : null
  };
}

const temperatureExtrema: DailyTemperatureExtrema = {
  minTemp: null,
  minTempAt: null,
  maxTemp: null,
  maxTempAt: null
};

export function getTemperatureExtrema(): Readonly<DailyTemperatureExtrema>
{
  return {
    minTemp: temperatureExtrema.minTemp,
    maxTemp: temperatureExtrema.maxTemp,
    minTempAt: temperatureExtrema.minTempAt ? new Date(temperatureExtrema.minTempAt) : null,
    maxTempAt: temperatureExtrema.maxTempAt? new Date(temperatureExtrema.maxTempAt) : null
  };
}

export function getSseUpdateData(): SseUpdateData
{
  return {
    temp: getCurrentObservations().temp,
    humidity: getCurrentObservations().humidity,
    dewPoint: getCurrentObservations().dewPoint,
    timestamp: getCurrentObservations().timestamp,
    minTemp: getTemperatureExtrema().minTemp,
    minTempAt: getTemperatureExtrema().minTempAt,
    maxTemp: getTemperatureExtrema().maxTemp,
    maxTempAt: getTemperatureExtrema().maxTempAt
  };
}

function calculateDewPoint(temperature: number, humidity: number)
{
  // Magnus-Tetens approximation
  const a = 17.62;
  const b = 243.12;

  const gamma = Math.log(humidity / 100) +(a * temperature) / (b + temperature);
  const dewPoint = (b * gamma) / (a - gamma);

  return dewPoint;
}

export function updateCurrentObservations(temperature: number, humidity: number, timestamp: Date)
{
  currentObservations.temp = temperature;
  currentObservations.humidity = humidity;
  currentObservations.dewPoint = calculateDewPoint(temperature, humidity);
  currentObservations.timestamp = timestamp;
}

export function updateTemperatureExtrema(temperature: number, timestamp: Date): boolean
{
  let changed = false;

  if (temperatureExtrema.maxTemp === null || temperature > temperatureExtrema.maxTemp)
  {
    temperatureExtrema.maxTemp = temperature;
    temperatureExtrema.maxTempAt = timestamp;
    changed = true;
  }

  if (temperatureExtrema.minTemp === null || temperature < temperatureExtrema.minTemp) 
  {
    temperatureExtrema.minTemp = temperature;
    temperatureExtrema.minTempAt = timestamp;
    changed = true;
  }

  return changed;
}

export function resetTemperatureExtrema()
{
  temperatureExtrema.minTemp = null;
  temperatureExtrema.minTempAt = null;
  temperatureExtrema.maxTemp = null;
  temperatureExtrema.maxTempAt = null;
}