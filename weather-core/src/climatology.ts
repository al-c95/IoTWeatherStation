import { Precipitation, Temperature, NullableDate } from "./dailyWeather";

export interface YearToDateSummary
{
    highestTemp: Temperature,
    highestTempDate: NullableDate,
    lowestTemp: Temperature,
    lowestTempDate: NullableDate,
    totalPrecipitation: Precipitation
}

export interface MonthlyAlmanac
{
    lowestTemp: Temperature,
    lowestTempDate: NullableDate,
    highestTemp: Temperature,
    highestTempDate: NullableDate
    // TODO: include long term average temperatures for the month (when climatology data is available).
}