import
{
  formatPressure,
  formatPrecipitation,
  formatTemperature,
  formatHumidity,
  formatLastUpdate,
  formatExtremeReading,
  formatMslPressureReading,
  formatLocalTime12h,
  formatDayAndMonth
} from "../../src/utils/formatters.js";

describe("formatPressure", () =>
{
    test("format pressure with one decimal and unit", () =>
    {
        expect(formatPressure(1000.0)).toBe('1000.0 hPa');
    });

    test("returns dash for null", () =>
    {
        expect(formatPressure(null)).toBe('-');
    });

    test("returns dash for undefined", () =>
    {
        expect(formatPressure(undefined)).toBe('-');
    });
});

describe("formatPrecipitation", () =>
{
    test("formats precipitation with one decimal and unit", () => 
    {
        expect(formatPrecipitation(0.0)).toBe('0.0 mm');
    });

    test("returns dash for null", () =>
    {
        expect(formatPrecipitation(null)).toBe('-');
    });

    test("returns dash for undefined", () =>
    {
        expect(formatPrecipitation(undefined)).toBe('-');
    });
});

describe("formatTemperature", () =>
{
    test("formats temperature with one decimal and unit", () =>
    {
        expect(formatTemperature(21.345)).toBe("21.3°C");
    });

    test("returns dash for null", () =>
    {
        expect(formatTemperature(null)).toBe("-");
    });

    test("returns dash for undefined", () =>
    {
        expect(formatTemperature(undefined)).toBe("-");
    });
});

describe("formatHumidity", () =>
{
    test("formats humidity with percent sign", () =>
    {
        expect(formatHumidity(55)).toBe("55%");
    });

    test("returns dash for null", () =>
    {
        expect(formatHumidity(null)).toBe("-");
    });
});

describe("formatLastUpdate", () =>
{
    test("formats last update correctly", () => 
    {
        expect(formatLastUpdate('now')).toBe('Last updated at: now');
    });

    test("returns dash for null", () => 
    {
        expect(formatLastUpdate(null)).toBe('-');
    });
});

describe("formatExtremeReading", () => 
{
    test("formats extreme reading correctly", () => 
    {
        expect(formatExtremeReading('0.0', 'now')).toBe('0.0 at now');
    });

    test("returns dash for null", () => 
    {
        expect(formatExtremeReading(null,null)).toBe('-');
    });
});

describe("formatMslPressureReading", () => 
{
    test("formats mslp reading correctly", () =>
    {
        expect(formatMslPressureReading('1000')).toBe('1000 hPa');
    });

    test("returns dash for null", () => 
    {
        expect(formatMslPressureReading(null)).toBe('-');
    });
});

describe("formatLocalTime12h", () => 
{
    test("formats local time correctly", () =>
    {
        expect(formatLocalTime12h("2026-01-18T05:20:55.783Z")).toBe('4:20 pm');
    });

    test("returns dash for dash", () =>
    {
        expect(formatLocalTime12h('-')).toBe('-');
    });

    test("returns dash for null", () =>
    {
        expect(formatLocalTime12h(null)).toBe('-');
    });
});

describe("formatDayAndMonth", () => 
{
    test("formats day and month correctly th", () => 
    {
        expect(formatDayAndMonth("2026-01-18T05:20:55.783Z")).toBe('January 18th');
    });

    test("formats day and monty correctly st", () =>
    {
        expect(formatDayAndMonth("2026-01-01T05:20:55.783Z")).toBe('January 1st');
    });

    test("formats day and month correctly nd", () => 
    {
        expect(formatDayAndMonth("2026-01-02T05:20:55.783Z")).toBe('January 2nd');
    });

    test("formats day and month correctly rd", () =>
    {
        expect(formatDayAndMonth("2026-01-03T05:20:55.783Z")).toBe('January 3rd');
    });

    test("returns dash for dash", () =>
    {
        expect(formatDayAndMonth('-')).toBe('-');
    });

    test("returns dash for null", () =>
    {
        expect(formatDayAndMonth(null)).toBe('-');
    });
});