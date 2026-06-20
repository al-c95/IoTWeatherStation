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
    timestamp: NullableDate;
}

type CurrentWindObservations = {
    meanSpeed: WindSpeed,
    gusts: WindSpeed,
    direction: WindDirection,
    timestamp: NullableDate
}

type HighestWindGust = {
    speed: WindSpeed,
    direction: WindDirection,
    timestamp: NullableDate
}

type CurrentObservations = {
    thp: CurrentThpObservations,
    precipitation: CurrentRainfallObservations,
    wind: CurrentWindObservations
}

export default CurrentObservations;