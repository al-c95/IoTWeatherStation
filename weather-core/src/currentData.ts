export type Temperature = number | null;
export type Humidity = number | null;
export type NullableDate = Date | null;
export type Precipitation = number | null;

export type CurrentObservations = {
  temp: Temperature;
  humidity: Humidity;
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
  timestamp: null
};

export function getCurrentObservations(): Readonly<CurrentObservations>
{
  return {
    temp: currentObservations.temp,
    humidity: currentObservations.humidity,
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
    timestamp: getCurrentObservations().timestamp,
    minTemp: getTemperatureExtrema().minTemp,
    minTempAt: getTemperatureExtrema().minTempAt,
    maxTemp: getTemperatureExtrema().maxTemp,
    maxTempAt: getTemperatureExtrema().maxTempAt
  };
}

export function updateCurrentObservations(temperature: number, humidity: number, timestamp: Date)
{
  currentObservations.temp = temperature;
  currentObservations.humidity = humidity;
  currentObservations.timestamp = timestamp;
}

export function updateTemperatureExtrema(temperature: number, timestamp: Date): boolean
{
  let changed = false;

  if (
    temperatureExtrema.maxTemp === null ||
    temperature > temperatureExtrema.maxTemp
  ) {
    temperatureExtrema.maxTemp = temperature;
    temperatureExtrema.maxTempAt = timestamp;
    changed = true;
  }

  if (
    temperatureExtrema.minTemp === null ||
    temperature < temperatureExtrema.minTemp
  ) {
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