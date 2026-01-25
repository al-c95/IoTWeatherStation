import { Precipitation, Temperature, NullableDate } from "./dailyWeather";

export interface YearToDateSummary
{
    highestTemp: Temperature,
    highestTempDate: NullableDate,
    lowestTemp: Temperature,
    lowestTempDate: NullableDate,
    totalPrecipitation: Precipitation
}