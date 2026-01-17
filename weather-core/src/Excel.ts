import ExcelJS from "exceljs";
import { Precipitation, Temperature, DailyWeather, } from "./dailyWeather";
import { getDailyWeatherForMonth } from "./db";
import config from "../../config/config.json";

export interface ExcelDailyRecord
{
    Date: number,
    MinTemp: Temperature,
    MaxTemp: Temperature,
    Precipitation: Precipitation
}

export interface ExcelMonthSheet
{
    Month: number,
    Year: number,
    Rows: ExcelDailyRecord[]
}

function mapDailyWeatherToExcelSheet(year: number, month: number, records: DailyWeather[]): ExcelMonthSheet
{
  return {
      Year: year,
      Month: month,
      Rows: records.map(r => ({
        Date: r.day,
        MinTemp: r.minTemp,
        MaxTemp: r.maxTemp,
        Precipitation: r.precipitation
    }))
  };
}

interface Styles
{
  minTempFont: Partial<ExcelJS.Font>;
  maxTempFont: Partial<ExcelJS.Font>;
  precipitationFont: Partial<ExcelJS.Font>;
  thinBorder: Partial<ExcelJS.Borders>;
}

function createStyles(): Styles
{
  return {
    minTempFont: {
      name: "Verdana",
      size: 9,
      color: { argb: "FF0000FF"}
    },
    maxTempFont: {
      name: "Verdana",
      size: 9,
      color: { argb: "FFFF0000"}
    },
    precipitationFont: {
      name: "Calibri",
      size: 11
    },
    thinBorder: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    }
  };
}

function createHeaders(worksheet: ExcelJS.Worksheet, sheetModel: ExcelMonthSheet, styles: Styles)
{
  worksheet.addRow([`${config.station_name}; ${config.altitude}m; ${config.latitude} ${config.longitude}`]);
  worksheet.addRow(["Daily Weather Observations"]);
  worksheet.addRow([`${sheetModel.Month}/${sheetModel.Year}`]);
  worksheet.addRow([]);
  worksheet.addRow(["Date", "Min Temp (°C)", "Max Temp (°C)", "Precipitation (mm)"]);

  const headerRow = worksheet.getRow(worksheet.rowCount);
  headerRow.eachCell(cell =>
  {
    cell.border = styles.thinBorder;
    cell.font = { bold: true };
  });
}

function getDaysInMonth(year: number, month: number): number
{
  return new Date(year, month, 0).getDate();
}

function writeDataRows(
  worksheet: ExcelJS.Worksheet,
  sheetModel: ExcelMonthSheet,
  styles: Styles,
  startRow: number
): { lastDataRow: number; nextRow: number }
{
  let rowIndex = startRow;

  const year = sheetModel.Year;
  const month = sheetModel.Month;
  const numberOfDays = getDaysInMonth(year, month);
  for (let day = 1; day <= numberOfDays; day++)
  {
    const recordForDay = sheetModel.Rows.find(r => r.Date === day);
    const row = worksheet.getRow(rowIndex);
    if (recordForDay)
    {
      const dayCell = row.getCell(1);
      dayCell.value = recordForDay.Date;
      dayCell.border = styles.thinBorder;
      dayCell.numFmt = "0";

      const minCell = row.getCell(2);
      minCell.value = recordForDay.MinTemp;
      minCell.font = styles.minTempFont;
      minCell.border = styles.thinBorder;
      minCell.numFmt = "0.0";

      const maxCell = row.getCell(3);
      maxCell.value = recordForDay.MaxTemp;
      maxCell.font = styles.maxTempFont;
      maxCell.border = styles.thinBorder;
      maxCell.numFmt = "0.0";

      const precipitationCell = row.getCell(4);
      precipitationCell.value = recordForDay.Precipitation;
      precipitationCell.font = styles.precipitationFont;
      precipitationCell.border = styles.thinBorder;
      precipitationCell.numFmt = "0.0";
    }
    else
    {
      const dayCell = row.getCell(1);
      dayCell.value = day;
      dayCell.border = styles.thinBorder;
      dayCell.numFmt = "0";

      const minCell = row.getCell(2);
      minCell.value = "";
      minCell.font = styles.minTempFont;
      minCell.border = styles.thinBorder;
      minCell.numFmt = "0.0";

      const maxCell = row.getCell(3);
      maxCell.value = "";
      maxCell.font = styles.maxTempFont;
      maxCell.border = styles.thinBorder;
      maxCell.numFmt = "0.0";

      const precipitationCell = row.getCell(4);
      precipitationCell.value = "";
      precipitationCell.font = styles.precipitationFont;
      precipitationCell.border = styles.thinBorder;
      precipitationCell.numFmt = "0.0";
    }

    row.commit();
    rowIndex++;
  }

  const lastDataRow = rowIndex - 1;

  return { lastDataRow, nextRow: rowIndex };
}

function writeSummaryFormulas(
  worksheet: ExcelJS.Worksheet,
  styles: Styles,
  startRow: number,
  firstDataRow: number,
  lastDataRow: number
)
{
  if (lastDataRow < firstDataRow)
  {
    return;
  }

  const summaries =
  [
    [
      "Mean",
      { formula: `AVERAGE(B${firstDataRow}:B${lastDataRow})` },
      { formula: `AVERAGE(C${firstDataRow}:C${lastDataRow})` },
      null
    ],
    [
      "Min",
      { formula: `MIN(B${firstDataRow}:B${lastDataRow})` },
      { formula: `MIN(C${firstDataRow}:C${lastDataRow})` },
      null
    ],
    [
      "Max",
      { formula: `MAX(B${firstDataRow}:B${lastDataRow})` },
      { formula: `MAX(C${firstDataRow}:C${lastDataRow})` },
      null
    ],
    [
      "Total",
      null,
      null,
      { formula: `SUM(D${firstDataRow}:D${lastDataRow})` }
    ]
  ];

  let rowIndex = startRow;

  for (const [label, minFormula, maxFormula, precipFormula] of summaries)
  {
    const row = worksheet.getRow(rowIndex);

    row.getCell(1).value = label;
    row.getCell(2).value = minFormula;
    row.getCell(3).value = maxFormula;
    row.getCell(4).value = precipFormula;

    const SUMMARY_COLUMNS = 4; // A..D

    for (let col = 1; col <= SUMMARY_COLUMNS; col++)
    {
      const cell = row.getCell(col);
      cell.border = styles.thinBorder;

      if (col !== 1) // not the label column
      {
        cell.numFmt = "0.0";
      }
    }

    row.eachCell(c =>
    {
      c.border = styles.thinBorder;
      c.numFmt = "0.0";
    });

    row.commit();
    rowIndex++;
  }
}

export async function createExportWorkbook(
  year: number, 
  month: number, 
  retrieveRecordsFunction: (year: number, month: number) => DailyWeather[] = getDailyWeatherForMonth
): Promise<Buffer>
{
  const records = retrieveRecordsFunction(year, month);
  const sheetModel = mapDailyWeatherToExcelSheet(year, month, records);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Daily Weather - ${sheetModel.Month}-${sheetModel.Year}`);

  const styles = createStyles();

  createHeaders(worksheet, sheetModel, styles);

  let firstDataRow = worksheet.rowCount + 1;

  const { lastDataRow, nextRow } = writeDataRows(
    worksheet,
    sheetModel,
    styles,
    firstDataRow
  );

  const summaryStartRow = nextRow;

  writeSummaryFormulas(
    worksheet,
    styles,
    summaryStartRow,
    firstDataRow,
    lastDataRow
  );

/*
  worksheet.columns =
  [
    { width: 10 },
    { width: 18 },
    { width: 18 }
  ];
*/
  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}