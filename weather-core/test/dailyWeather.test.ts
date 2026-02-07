import { processTemperatureHumidityAndPressureObservations } from "../src/dailyWeather";
import {getTemperatureExtrema, resetTemperatureExtrema, getCurrentObservations} from "../src/currentData";

describe("processTemperatureAndHumidityObservations", () => {
    beforeEach(() => {
        resetTemperatureExtrema();
        resetTemperatureExtrema?.();
      });
    
      test("updates current observations and persists on first reading", () => {
        // arrange
        const persistFn = jest.fn();
        const now = new Date();
    
        // act
        const result = processTemperatureHumidityAndPressureObservations(25, 50, 1000, now, persistFn);
    
        // assert
        expect(getCurrentObservations().temp).toBe(25);
        expect(getCurrentObservations().humidity).toBe(50);
        expect(getTemperatureExtrema().minTemp).toBe(25);
        expect(getTemperatureExtrema().maxTemp).toBe(25);
        expect(persistFn).toHaveBeenCalledTimes(1);
        expect(persistFn).toHaveBeenCalledWith(now, 25, 25, now, now);
      });
    
      test("does not persist when extrema does not change", () => {
        // arrange
        const persistFn = jest.fn();
        const t1 = new Date("2026-01-12T10:00:00Z");
        const t2 = new Date("2026-01-12T10:01:00Z");
        processTemperatureHumidityAndPressureObservations(25, 50, 1000, t1, persistFn);
        persistFn.mockClear();
    
        // act
        const result = processTemperatureHumidityAndPressureObservations(25, 51, 1000, t2, persistFn);

        // assert
        expect(persistFn).not.toHaveBeenCalled();
      });
    
      test("persists when a new max occurs", () => {
        // arrange
        const persistFn = jest.fn();
        const t1 = new Date("2026-01-12T10:00:00Z");
        const t2 = new Date("2026-01-12T11:00:00Z");
        processTemperatureHumidityAndPressureObservations(20, 40, 1000, t1, persistFn);
        persistFn.mockClear();
        
        // act
        const result = processTemperatureHumidityAndPressureObservations(30, 45, 1000, t2, persistFn);

        // assert
        expect(persistFn).toHaveBeenCalledTimes(1);
      });
});