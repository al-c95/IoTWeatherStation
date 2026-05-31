import {
  validateRange,
  sanitiseTemperature,
  sanitiseHumidity
} from "../../src/currentConditions/validation";

describe("validateRange", () => {
    it("returns true inside range", () => {
        expect(validateRange(5, 0, 10)).toBe(true);
    });

    it("returns false outside range", () => {
        expect(validateRange(15, 0, 10)).toBe(false);
    });
});

describe("sanitiseTemperature", () => {
    it("accepts valid temperature", () => {
        expect(sanitiseTemperature(25)).toBe(true);
    });

    it("rejects invalid temperature", () => {
        expect(sanitiseTemperature(-50)).toBe(false);
    });
});

describe("sanitiseHumidity", () => {
    it("accepts valid humidity", () => {
        expect(sanitiseHumidity(50)).toBe(true);
    });

    it("rejects invalid humidity", () => {
        expect(sanitiseHumidity(120)).toBe(false);
    });
});