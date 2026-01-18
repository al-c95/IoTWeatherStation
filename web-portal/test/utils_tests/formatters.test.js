import
{
  formatTemperature,
  formatHumidity,
  formatLastUpdate,
  formatExtremeReading,
  formatMslPressureReading
} from "../../src/utils/formatters.js";

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
    test("formats mslp reading correclty", () =>
    {
        expect(formatMslPressureReading('1000')).toBe('1000 hPa');
    });

    test("returns dash for null", () => 
    {
        expect(formatMslPressureReading(null)).toBe('-');
    });
});