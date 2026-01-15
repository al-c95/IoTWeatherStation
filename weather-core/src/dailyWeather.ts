import { db } from "./db";
import { getTemperatureExtrema, updateCurrentObservations, updateTemperatureExtrema } from "./currentData";

export type Temperature = number | null;
export type Humidity = number | null;
export type NullableDate = Date | null;
export type Precipitation = number | null;

export function persistDailyTemperatureExtrema(timestamp: Date): void
{
    const year = timestamp.getFullYear();
    const month = timestamp.getMonth() + 1; // JS months are 0-based
    const day = timestamp.getDate();
    
    const stmt = db.prepare(`
    INSERT INTO daily_weather (
      year,
      month,
      day,
      min_temp,
      min_temp_time,
      max_temp,
      max_temp_time
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(year, month, day) DO UPDATE SET
      min_temp = excluded.min_temp,
      min_temp_time = excluded.min_temp_time,
      max_temp = excluded.max_temp,
      max_temp_time = excluded.max_temp_time
  `);

  stmt.run(
    year,
    month,
    day,
    getTemperatureExtrema().minTemp,
    getTemperatureExtrema().minTempAt?.toISOString() ?? null,
    getTemperatureExtrema().maxTemp,
    getTemperatureExtrema().maxTempAt?.toISOString() ?? null
  );
}

export function processTemperatureAndHumidityObservations(temperature: number, humidity: number, timestamp: Date, persistFunction: (ts: Date) => void = persistDailyTemperatureExtrema)
{
    updateCurrentObservations(temperature, humidity, timestamp);

    if (updateTemperatureExtrema(temperature, timestamp))
    {
        persistFunction(timestamp);
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

export function getDailyWeatherLastNDays(days: number): DailyWeather[]
{
  const stmt = db.prepare(`
    WITH RECURSIVE dates(d) AS (
      SELECT date('now', 'localtime')
      UNION ALL
      SELECT date(d, '-1 day')
      FROM dates
      WHERE d > date('now', 'localtime', '-' || (? - 1) || ' days')
    )
    SELECT
      CAST(strftime('%d', d) AS INTEGER) AS day,
      CAST(strftime('%m', d) AS INTEGER) AS month,
      CAST(strftime('%Y', d) AS INTEGER) AS year,
      w.min_temp      AS minTemp,
      w.max_temp      AS maxTemp,
      w.precipitation AS precipitation
    FROM dates
    LEFT JOIN daily_weather w
      ON w.year  = CAST(strftime('%Y', d) AS INTEGER)
     AND w.month = CAST(strftime('%m', d) AS INTEGER)
     AND w.day   = CAST(strftime('%d', d) AS INTEGER)
    ORDER BY year DESC, month DESC, day DESC;
  `);

  return stmt.all(days) as DailyWeather[];
}

export function getDailyWeatherForMonth(year: number, month: number): DailyWeather[]
{
  const stmt = db.prepare(`
    SELECT
      day,
      min_temp AS minTemp,
      max_temp AS maxTemp,
      precipitation AS precipitation
    FROM daily_weather
    WHERE year = ? AND month = ?
    ORDER BY day ASC
  `);

  return stmt.all(year,month) as DailyWeather[];
}