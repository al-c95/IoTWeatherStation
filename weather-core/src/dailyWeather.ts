import ExcelJS from "exceljs";
import { db } from "./db";
import { Temperature, Precipitation, getTemperatureExtrema, updateCurrentObservations, updateTemperatureExtrema } from "./currentData";

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

export async function createExportWorkbook(year: number, month: number): Promise<Buffer>
{
  const records = getDailyWeatherForMonth(year, month);

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(`Daily Weather - ${month}-${year}`);

  /* ---------- Styles ---------- */

  const minTempFont = {
    name: "Verdana",
    size: 9,
    color: { argb: "FF0000FF" } // blue
  };

  const maxTempFont = {
    name: "Verdana",
    size: 9,
    color: { argb: "FFFF0000" } // red
  };

  const thinBorder = {
    top: { style: "thin" as const },
    bottom: { style: "thin" as const },
    left: { style: "thin" as const },
    right: { style: "thin" as const }
  };

  /* ---------- Headers ---------- */

  ws.addRow(["Daily Weather Observations"]);
  ws.addRow([`${month}/${year}`]);
  ws.addRow([]);
  ws.addRow(["Date", "Min Temp (°C)", "Max Temp (°C)"]);

  const headerRow = ws.getRow(ws.rowCount);
  headerRow.eachCell(cell => {
    cell.border = thinBorder;
    cell.font = { bold: true };
  });

  /* ---------- Data rows ---------- */

  let rowIndex = ws.rowCount + 1;

  for (const record of records)
  {
    const row = ws.getRow(rowIndex);

    const dayCell = row.getCell(1);
    dayCell.value = record.day;

    const minCell = row.getCell(2);
    minCell.value = record.minTemp;
    minCell.font = minTempFont;

    const maxCell = row.getCell(3);
    maxCell.value = record.maxTemp;
    maxCell.font = maxTempFont;

    [minCell, maxCell].forEach(c => {
      c.border = thinBorder;
      c.numFmt = "0.0";
    });

    [dayCell].forEach(c => {
      c.border = thinBorder;
      c.numFmt = "0";
    })

    row.commit();
    rowIndex++;
  }

  const lastDataRow = rowIndex - 1;
  const summaryStartRow = rowIndex;

  /* ---------- Summary formulas ---------- */

  const summaries = [
    ["Mean",
      { formula: `AVERAGE(B5:B${lastDataRow})` },
      { formula: `AVERAGE(C5:C${lastDataRow})` }
    ],
    ["Min",
      { formula: `MIN(B5:B${lastDataRow})` },
      { formula: `MIN(C5:C${lastDataRow})` }
    ],
    ["Max",
      { formula: `MAX(B5:B${lastDataRow})` },
      { formula: `MAX(C5:C${lastDataRow})` }
    ]
  ];

  for (const [label, minFormula, maxFormula] of summaries)
  {
    const row = ws.getRow(rowIndex);

    row.getCell(1).value = label;
    row.getCell(2).value = minFormula;
    row.getCell(3).value = maxFormula;

    row.eachCell(c => {
      c.border = thinBorder;
      c.numFmt = "0.0";
    });

    row.commit();
    rowIndex++;
  }

  /* ---------- Column widths ---------- */

  ws.columns = [
    { width: 10 },
    { width: 18 },
    { width: 18 }
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}