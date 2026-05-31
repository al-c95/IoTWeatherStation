import {
  calculateDewPoint,
  calculateMslp
} from "../../src/currentConditions/calculations";

describe("calculateDewPoint", () => {
    it("calculates dew point", () => {
        expect(
        calculateDewPoint(25, 50)
        ).toBeCloseTo(13.9, 1);
    });
});

describe("calculateMslp", () => {
    it("returns same pressure at sea level", () => {
        expect(
        calculateMslp(1000, 0)
        ).toBeCloseTo(1000, 5);
    });
});