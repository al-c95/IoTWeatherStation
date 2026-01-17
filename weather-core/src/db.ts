import Database from "better-sqlite3";
import path from "path";
import { DailyWeather, Temperature, NullableDate } from "./dailyWeather";

const dbPath = path.resolve(__dirname, "../../weather.db");

export const db = new Database(dbPath);

// Optional but recommended
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Schema sanity check
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all()
  .map((r: any) => r.name);

console.log("SQLite tables:", tables);

if (!tables.includes("daily_weather")) {
  throw new Error(
    "Database opened, but expected table 'daily_weather' was not found."
  );
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

export function persistDailyTemperatureExtrema(
  timestamp: Date, 
  minTemp: Temperature, 
  maxTemp: Temperature, 
  minTempAt: NullableDate,
  maxTempAt: NullableDate
): void
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
    minTemp,
    minTempAt?.toISOString() ?? null,
    maxTemp,
    maxTempAt?.toISOString() ?? null
  );
}