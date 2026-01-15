import { processTemperatureAndHumidityObservations } from "../src/dailyWeather";
import {getTemperatureExtrema, updateTemperatureExtrema, resetTemperatureExtrema, updateCurrentObservations, getCurrentObservations} from "../src/currentData";

describe("processTemperatureAndHumidityObservations", () => {
    beforeEach(() => {
        resetTemperatureExtrema();
        resetTemperatureExtrema?.();
      });
    
      test("updates current observations and persists on first reading", () => {
        const persistFn = jest.fn();
        const now = new Date();
    
        const result = processTemperatureAndHumidityObservations(25, 50, now, persistFn);
    
        expect(getCurrentObservations().temp).toBe(25);
        expect(getCurrentObservations().humidity).toBe(50);
    
        expect(getTemperatureExtrema().minTemp).toBe(25);
        expect(getTemperatureExtrema().maxTemp).toBe(25);
    
        expect(persistFn).toHaveBeenCalledTimes(1);
        expect(persistFn).toHaveBeenCalledWith(now);
      });
    
      test("does not persist when extrema does not change", () => {
        const persistFn = jest.fn();
        const t1 = new Date("2026-01-12T10:00:00Z");
        const t2 = new Date("2026-01-12T10:01:00Z");
    
        // first reading sets extrema -> persist
        processTemperatureAndHumidityObservations(25, 50, t1, persistFn);
        persistFn.mockClear();
    
        // second reading in-range should not change extrema -> no persist
        const result = processTemperatureAndHumidityObservations(25, 51, t2, persistFn);

        expect(persistFn).not.toHaveBeenCalled();
      });
    
      test("persists when a new max occurs", () => {
        const persistFn = jest.fn();
        const t1 = new Date("2026-01-12T10:00:00Z");
        const t2 = new Date("2026-01-12T11:00:00Z");
    
        processTemperatureAndHumidityObservations(20, 40, t1, persistFn);
        persistFn.mockClear();
    
        const result = processTemperatureAndHumidityObservations(30, 45, t2, persistFn);

        expect(persistFn).toHaveBeenCalledTimes(1);
      });
});