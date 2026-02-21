export type Temperature = number | null;
export type Humidity = number | null;
export type NullableDate = Date | null;
export type Precipitation = number | null;
export type Pressure = number | null;

export interface DailyWeather
{
    day: number;
    month: number;
    year: number;
    minTemp: Temperature;
    maxTemp: Temperature;
    precipitation: Precipitation;
}