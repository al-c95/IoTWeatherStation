import CurrentObservations from "./types/CurrentObservations";
import DailyTemperatureExtrema from "./types/DailyTemperatureExtrema";
import ThpObservations from "./types/ThpObservations";
import SseUpdateData from "./types/SseUpdateData";
import { getCurrentTimestamp } from "./utils";
import { getCurrentTemperatureExtrema } from "./db";
import config from "../../config/config.json";

const elevation: number = config.elevation;

const currentObservations: CurrentObservations = {
  temp: null,
  humidity: null,
  dewPoint: null,
  mslPressure: null,
  timestamp: null
};

const temperatureExtrema: DailyTemperatureExtrema = {
  minTemp: null,
  minTempAt: null,
  maxTemp: null,
  maxTempAt: null
};

export function getCurrentObservations(): Readonly<CurrentObservations>
{
  return {
    temp: currentObservations.temp,
    humidity: currentObservations.humidity,
    dewPoint: currentObservations.dewPoint,
    mslPressure: currentObservations.mslPressure,
    timestamp: currentObservations.timestamp ? new Date(currentObservations.timestamp) : null
  };
}

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
    mslPressure: getCurrentObservations().mslPressure,
    timestamp: getCurrentObservations().timestamp,
    minTemp: getTemperatureExtrema().minTemp,
    minTempAt: getTemperatureExtrema().minTempAt,
    maxTemp: getTemperatureExtrema().maxTemp,
    maxTempAt: getTemperatureExtrema().maxTempAt
  };
}

function calculateMslp(rawPressure: number, elevation: number)
{
  // simplified barometric formula
  return rawPressure * Math.pow(1 - elevation / 44330, -5.255);
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

function validateRange(value: number, lowerBound: number, upperBound: number): boolean
{
  if (value >= lowerBound && value <= upperBound)
  {
    return true;
  }
  return false;
}

function sanitiseTemperature(temperature: number)
{
  return validateRange(temperature, -40, 60);
}

function sanitiseHumidity(humidity: number)
{
  return validateRange(humidity, 0, 100);
}

export function updateCurrentThpObservations(observations: ThpObservations)
{
  currentObservations.timestamp = observations.timestamp;

  let temperatureSane: boolean = sanitiseTemperature(observations.temperature);
  let humiditySane: boolean = sanitiseHumidity(observations.humidity);
  let sane: boolean = 
    temperatureSane && humiditySane;
  if (sane)
  {
    currentObservations.dewPoint=calculateDewPoint(observations.temperature, observations.humidity);
  }
  else
  {
    currentObservations.dewPoint=null;
  }

  if (temperatureSane)
  {
    currentObservations.temp = observations.temperature;
  }
  else
  {
    currentObservations.temp = null;
  }

  if (humiditySane)
  {
    currentObservations.humidity = observations.humidity;
  }
  else
  {
    currentObservations.humidity=null;
  }
  
  currentObservations.mslPressure = calculateMslp(observations.rawPressure, elevation);
}

export function retrieveCurrentTemperatureExtrema(retrieveFunction: (year: number, month: number, day: number) => DailyTemperatureExtrema = getCurrentTemperatureExtrema)
{
  const now = getCurrentTimestamp();
  const currentExtrema = retrieveFunction(now.getFullYear(), now.getMonth() + 1, now.getDate());

  if (currentExtrema != undefined)
  {
    temperatureExtrema.minTemp=currentExtrema.minTemp;
    temperatureExtrema.minTempAt=currentExtrema.minTempAt;
    temperatureExtrema.maxTemp=currentExtrema.maxTemp;
    temperatureExtrema.maxTempAt=currentExtrema.maxTempAt;
  }
}

export function resetTemperatureExtrema()
{
  temperatureExtrema.minTemp = null;
  temperatureExtrema.minTempAt = null;
  temperatureExtrema.maxTemp = null;
  temperatureExtrema.maxTempAt = null;
}