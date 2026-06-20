import { Temperature, Humidity, Pressure, NullableDate, Precipitation, WindSpeed, WindDirection } from "./DailyWeather";

type CurrentThpObservations = {
    temp: Temperature;
    humidity: Humidity;
    dewPoint: Temperature;
    mslPressure: Pressure;
    timestamp: NullableDate;
}

type CurrentRainfallObservations = {
    totalPrecipitation: Precipitation;
}

type CurrentWindObservations = {
    meanSpeed: WindSpeed,
    gusts: WindSpeed,
    direction: WindDirection
}

type HighestWindGust = {
    speed: WindSpeed,
    direction: WindDirection
}

type CurrentObservations = {
    temp: Temperature;
    humidity: Humidity;
    dewPoint: Temperature;
    mslPressure: Pressure;
    totalPrecipitation: Precipitation;
    timestamp: NullableDate;
  };

export default CurrentObservations;