import ExcelJS from "exceljs";
import { Precipitation, Temperature, DailyWeather, getDailyWeatherForMonth  } from "./dailyWeather"

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

export async function createExportWorkbook(year: number, month: number, retrieveRecordsFunction: (year: number, month: number) => DailyWeather[] = getDailyWeatherForMonth): Promise<Buffer>
{
  const records = retrieveRecordsFunction(year, month);

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