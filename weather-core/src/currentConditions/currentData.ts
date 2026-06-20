import CurrentObservations from "../types/CurrentObservations";
import DailyTemperatureExtrema from "../types/DailyTemperatureExtrema";
import ThpObservations from "../types/ThpObservations";
import SseUpdateData from "../types/SseUpdateData";
import { getCurrentTimestamp } from "../utils";
import { getCurrentTemperatureExtrema, getDailyRainTotal } from "../db";
import config from "../../../config/config.json";
import { calculateDewPoint, calculateMslp } from "./calculations";
import { sanitiseHumidity, sanitiseTemperature } from "./validation";

const elevation: number = config.elevation;

const currentObservations: CurrentObservations = {
    thp: {
        temp: null,
        humidity: null,
        dewPoint: null,
        mslPressure: null,
        timestamp: null
    },
    precipitation: {
        totalPrecipitation: null,
        timestamp: null
    },
    wind: {
        meanSpeed: null,
        gusts: null,
        direction: null,
        timestamp: null
    }
}

const temperatureExtrema: DailyTemperatureExtrema = {
    minTemp: null,
    minTempAt: null,
    maxTemp: null,
    maxTempAt: null
};

export function getCurrentObservations(): Readonly<CurrentObservations> {

    const currentThpObservations = currentObservations.thp;
    const currentPrecipitationObservations = currentObservations.precipitation;
    const currentWindObservations = currentObservations.wind;

    return {
        thp: {
            temp: currentThpObservations.temp,
            humidity: currentThpObservations.humidity,
            dewPoint: currentThpObservations.dewPoint,
            mslPressure: currentThpObservations.mslPressure,
            timestamp: currentThpObservations.timestamp
        },
        precipitation: {
            totalPrecipitation: currentPrecipitationObservations.totalPrecipitation,
            timestamp: currentPrecipitationObservations.timestamp
        },
        wind: {
            meanSpeed: currentWindObservations.meanSpeed,
            gusts: currentWindObservations.gusts,
            direction: currentWindObservations.direction,
            timestamp: currentWindObservations.timestamp
        }
    }
}

export function getTemperatureExtrema(): Readonly<DailyTemperatureExtrema> {
    return {
        minTemp: temperatureExtrema.minTemp,
        maxTemp: temperatureExtrema.maxTemp,
        minTempAt: temperatureExtrema.minTempAt ? new Date(temperatureExtrema.minTempAt) : null,
        maxTempAt: temperatureExtrema.maxTempAt ? new Date(temperatureExtrema.maxTempAt) : null
    };
}

export function getSseUpdateData(): SseUpdateData {
    return {
        thp: {
            temp: getCurrentObservations().thp.temp,
            humidity: getCurrentObservations().thp.humidity,
            dewPoint: getCurrentObservations().thp.dewPoint,
            mslPressure: getCurrentObservations().thp.mslPressure,
            timestamp: getCurrentObservations().thp.timestamp
        },
        precipitation: {
            totalPrecipitation: getCurrentObservations().precipitation.totalPrecipitation,
            timestamp: getCurrentObservations().precipitation.timestamp
        },
        wind: {
            meanSpeed: null,
            direction: null,
            gusts: null,
            timestamp: null
        },
        minTemp: getTemperatureExtrema().minTemp,
        minTempAt: getTemperatureExtrema().minTempAt,
        maxTemp: getTemperatureExtrema().maxTemp,
        maxTempAt: getTemperatureExtrema().maxTempAt
    }
}

export function updateCurrentThpObservations(observations: ThpObservations) {
    currentObservations.thp.timestamp = observations.timestamp;

    let temperatureSane: boolean = sanitiseTemperature(observations.temperature);
    let humiditySane: boolean = sanitiseHumidity(observations.humidity);
    let sane: boolean = 
      temperatureSane && humiditySane;
    if (sane) {
        currentObservations.thp.dewPoint = calculateDewPoint(observations.temperature, observations.humidity);
    }
    else {
        currentObservations.thp.dewPoint = null;
    }

    if (temperatureSane) {
        currentObservations.thp.temp = observations.temperature;
    }
    else {
        currentObservations.thp.temp = null;
    }

    if (humiditySane) {
        currentObservations.thp.humidity = observations.humidity;
    }
    else {
        currentObservations.thp.humidity = null;
    }
  
    currentObservations.thp.mslPressure = calculateMslp(observations.rawPressure, elevation);
}

export function retrieveCurrentTemperatureExtrema(retrieveFunction: (year: number, month: number, day: number) => DailyTemperatureExtrema = getCurrentTemperatureExtrema) {
    const now = getCurrentTimestamp();
    const currentExtrema = retrieveFunction(now.getFullYear(), now.getMonth() + 1, now.getDate());

    if (currentExtrema != undefined) {
        temperatureExtrema.minTemp=currentExtrema.minTemp;
        temperatureExtrema.minTempAt=currentExtrema.minTempAt;
        temperatureExtrema.maxTemp=currentExtrema.maxTemp;
        temperatureExtrema.maxTempAt=currentExtrema.maxTempAt;
    }
}

export function retrieveCurrentTotalRain() {
    const now = getCurrentTimestamp();
    currentObservations.precipitation.totalPrecipitation = getDailyRainTotal(now);
    currentObservations.precipitation.timestamp = getCurrentTimestamp();
}

export function hydrateCurrentState() {
    retrieveCurrentTemperatureExtrema();
    retrieveCurrentTotalRain();
}

export function resetTemperatureExtrema() {
    temperatureExtrema.minTemp = null;
    temperatureExtrema.minTempAt = null;
    temperatureExtrema.maxTemp = null;
    temperatureExtrema.maxTempAt = null;
}

export function resetRain() {
    currentObservations.precipitation.totalPrecipitation = null;
}