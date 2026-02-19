import Database from "better-sqlite3";
import path from "path";
import { MonthlyAlmanac, YearToDateSummary } from "./climatology";
import { DailyTemperatureExtrema } from "./currentData";
import { DailyWeather, Temperature, NullableDate, Humidity, Pressure } from "./dailyWeather";

const dbPath = path.resolve(__dirname, "../../weather.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// schema sanity check
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
      SELECT date('now', 'utc')
      UNION ALL
      SELECT date(d, '-1 day')
      FROM dates
      WHERE d > date('now', 'utc', '-' || (? - 1) || ' days')
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
      ON w.date = d
    ORDER BY d DESC;
  `);

  return stmt.all(days) as DailyWeather[];
}

export function getDailyWeatherForMonth(
  year: number,
  month: number
): DailyWeather[] {

  const mm = String(month).padStart(2, "0");
  const yearMonth = `${year}-${mm}`;

  const stmt = db.prepare(`
    SELECT
      CAST(strftime('%d', date) AS INTEGER) AS day,
      min_temp AS minTemp,
      max_temp AS maxTemp,
      precipitation AS precipitation
    FROM daily_weather
    WHERE date LIKE ? || '%'
    ORDER BY date ASC
  `);

  return stmt.all(yearMonth) as DailyWeather[];
}

export function getCurrentTemperatureExtrema(year: number, month: number, day: number): DailyTemperatureExtrema
{
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const date = `${year}-${mm}-${dd}`;
  
  const stmt = db.prepare(`
    SELECT
      min_temp AS minTemp,
      max_temp AS maxTemp,
      max_temp_time AS maxTempAt,
      min_temp_time AS minTempAt
    FROM daily_weather
    WHERE date = ?
  `);

  return stmt.get(date) as DailyTemperatureExtrema;
}

export function persistObservations(
  timestamp: Date,
  temperature: number | null,
  humidity: number | null,
  mslPressure: number | null
): void {

  const isoTimestamp = timestamp.toISOString(); // UTC
  const date = isoTimestamp.slice(0, 10);       // YYYY-MM-DD

  const tx = db.transaction(() => {

    // insert raw observation
    db.prepare(`
      INSERT INTO observations (
        timestamp,
        temperature,
        humidity,
        pressure
      ) VALUES (?, ?, ?, ?)
    `).run(
      isoTimestamp,
      temperature,
      humidity,
      mslPressure
    );

    // ensure daily row exists
    db.prepare(`
      INSERT INTO daily_weather (
        date,
        min_temp,
        max_temp,
        min_temp_time,
        max_temp_time,
        precipitation
      )
      VALUES (?, ?, ?, ?, ?, 0)
      ON CONFLICT(date) DO NOTHING
    `).run(
      date,
      temperature,
      temperature,
      temperature !== null ? isoTimestamp : null,
      temperature !== null ? isoTimestamp : null
    );

    // update min/max + times
    if (temperature !== null) {
      db.prepare(`
  UPDATE daily_weather
  SET
    min_temp = CASE
      WHEN min_temp IS NULL THEN ?
      WHEN ? < min_temp THEN ?
      ELSE min_temp
    END,
    min_temp_time = CASE
      WHEN min_temp IS NULL THEN ?
      WHEN ? < min_temp THEN ?
      ELSE min_temp_time
    END,
    max_temp = CASE
      WHEN max_temp IS NULL THEN ?
      WHEN ? > max_temp THEN ?
      ELSE max_temp
    END,
    max_temp_time = CASE
      WHEN max_temp IS NULL THEN ?
      WHEN ? > max_temp THEN ?
      ELSE max_temp_time
    END
  WHERE date = ?
`).run(
  // min_temp
  temperature,
  temperature,
  temperature,

  // min_temp_time
  isoTimestamp,
  temperature,
  isoTimestamp,

  // max_temp
  temperature,
  temperature,
  temperature,

  // max_temp_time
  isoTimestamp,
  temperature,
  isoTimestamp,

  // WHERE
  date
);
    }

  });

  tx();
}

export function getYearToDateSummary(year: number): YearToDateSummary
{
  const stmt = db.prepare(`
    SELECT
      ? AS year,

      -- Minimum temperature and when it occurred
      (
        SELECT min_temp
        FROM daily_weather
        WHERE strftime('%Y', date) = ?
        ORDER BY min_temp ASC
        LIMIT 1
      ) AS minTemp,

      (
        SELECT min_temp_time
        FROM daily_weather
        WHERE strftime('%Y', date) = ?
        ORDER BY min_temp ASC
        LIMIT 1
      ) AS minTempAt,

      -- Maximum temperature and when it occurred
      (
        SELECT max_temp
        FROM daily_weather
        WHERE strftime('%Y', date) = ?
        ORDER BY max_temp DESC
        LIMIT 1
      ) AS maxTemp,

      (
        SELECT max_temp_time
        FROM daily_weather
        WHERE strftime('%Y', date) = ?
        ORDER BY max_temp DESC
        LIMIT 1
      ) AS maxTempAt,

      -- Total precipitation year to date
      (
        SELECT COALESCE(SUM(precipitation), 0)
        FROM daily_weather
        WHERE strftime('%Y', date) = ?
      ) AS totalPrecipitation
  `);

  return stmt.get(
    year,
    String(year),
    String(year),
    String(year),
    String(year),
    String(year)
  ) as YearToDateSummary;
}

export function getMonthlyAlmanac(
  year: number,
  month: number
): MonthlyAlmanac {

  const mm = String(month).padStart(2, "0");
  const start = `${year}-${mm}-01`;
  const end   = `${year}-${mm}-31`; // safe upper bound

  const stmt = db.prepare(`
    WITH
    minRow AS (
      SELECT min_temp, min_temp_time
      FROM daily_weather
      WHERE date BETWEEN ? AND ?
      ORDER BY min_temp ASC
      LIMIT 1
    ),
    maxRow AS (
      SELECT max_temp, max_temp_time
      FROM daily_weather
      WHERE date BETWEEN ? AND ?
      ORDER BY max_temp DESC
      LIMIT 1
    )
    SELECT
      ? AS year,
      minRow.min_temp      AS minTemp,
      minRow.min_temp_time AS minTempAt,
      maxRow.max_temp      AS maxTemp,
      maxRow.max_temp_time AS maxTempAt
    FROM minRow, maxRow
  `);

  return stmt.get(
    start, end,   // minRow
    start, end,   // maxRow
    year
  ) as MonthlyAlmanac;
}