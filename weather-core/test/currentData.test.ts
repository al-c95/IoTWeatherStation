import {getTemperatureExtrema, updateTemperatureExtrema, resetTemperatureExtrema, updateCurrentObservations, getCurrentObservations, getSseUpdateData, retrieveCurrentTemperatureExtrema} from "../src/currentData";
import * as utils from "../src/utils";

jest.mock("../../config/config.json", () => ({
  elevation: 0
}));

describe("updateTemperatureExtrema", () => {
    beforeEach(() => {
      resetTemperatureExtrema();
    });
  
    it("sets min and max on first observation", () => {
      // arrange
      const now = new Date();
  
      // act
      const changed = updateTemperatureExtrema(25, now);
      
      // assert
      expect(changed).toBe(true);
      expect(getTemperatureExtrema().minTemp).toBe(25);
      expect(getTemperatureExtrema().maxTemp).toBe(25);
    });

    it("sets min on subsequent observations", () => {
      // arrange
      updateTemperatureExtrema(25, new Date());

      // act
      let changed = updateTemperatureExtrema(23, new Date());

      // assert
      expect(changed).toBe(true);
      expect(getTemperatureExtrema().minTemp).toBe(23);
      expect(getTemperatureExtrema().maxTemp).toBe(25);
    });

    it("sets max on subsequent observations", () => {
      // arrange
      updateTemperatureExtrema(25, new Date());

      // act
      let changed = updateTemperatureExtrema(27, new Date());

      // assert
      expect(changed).toBe(true);
      expect(getTemperatureExtrema().minTemp).toBe(25);
      expect(getTemperatureExtrema().maxTemp).toBe(27);
    })

    it("invalid temperature returns false and does not update extrema", () => {
      // arrange
      updateTemperatureExtrema(25, new Date());

      // act
      let changed = updateTemperatureExtrema(-45, new Date());

      // assert
      expect(changed).toBe(false);
      expect(getTemperatureExtrema().minTemp).toBe(25);
      expect(getTemperatureExtrema().maxTemp).toBe(25);
    })
});

describe("updateCurrentObservations", () => {
  it("temperature and humidity and pressure valid updates observations", () => {
    // arrange
    const now = new Date();

    // act
    updateCurrentObservations(25, 50, 1000, now);

    // assert
    expect(getCurrentObservations().temp).toBe(25);
    expect(getCurrentObservations().humidity).toBe(50);
    expect(getCurrentObservations().dewPoint).toBeCloseTo(13.9,1);
    expect(getCurrentObservations().mslPressure).toBe(1000);
  })

  it("temperature valid humidity invalid updates observations", () => {
    // arrange
    const now = new Date();

    // act
    updateCurrentObservations(25, -1, 1000, now);

    // assert
    expect(getCurrentObservations().temp).toBe(25);
    expect(getCurrentObservations().humidity).toBe(null);
    expect(getCurrentObservations().dewPoint).toBe(null);
    expect(getCurrentObservations().mslPressure).toBe(1000);
  })

  it("temperature invalid humidity valid updates observations", () => {
    // arrange
    const now = new Date();

    // act
    updateCurrentObservations(-45, 50, 1000, now);

    // assert
    expect(getCurrentObservations().temp).toBe(null);
    expect(getCurrentObservations().humidity).toBe(50);
    expect(getCurrentObservations().dewPoint).toBe(null);
    expect(getCurrentObservations().mslPressure).toBe(1000);
  })
});

describe("getSseUpdateData", () => {
  it("updates sse", () => {
    // arrange
    const now = new Date();
    updateCurrentObservations(25, 50, 1000, now);
    updateTemperatureExtrema(25, now);
    updateCurrentObservations(27, 50, 1000, new Date());
    updateTemperatureExtrema(27, new Date());

    // act
    const data = getSseUpdateData();

    // assert
    expect(data.temp).toBe(27);
    expect(data.humidity).toBe(50);
    expect(data.minTemp).toBe(25);
    expect(data.maxTemp).toBe(27);
  })
});

describe("retrieveCurrentTemperatureExtrema", () => {
  it("retrieves extrema", () => {
    // arrange
    // mock the current timestamp
    jest.spyOn(utils, "getCurrentTimestamp").mockReturnValue(
      new Date("2026-01-18T10:00:00")
    );
    // fake DB response
    const fakeDbResult =
    {
      minTemp: -2,
      minTempAt: new Date("2026-01-18T06:00:00"),
      maxTemp: 27,
      maxTempAt: new Date("2026-01-18T14:00:00")
    };
    const mockRetrieve = jest.fn().mockReturnValue(fakeDbResult);

    // act
    retrieveCurrentTemperatureExtrema(mockRetrieve);

    // assert
    const extrema = getTemperatureExtrema();
    expect(extrema.minTemp).toBe(-2);
    expect(extrema.maxTemp).toBe(27);
  }),

  it("does not overwrite if no current extrema", () => {
    // arrange
    jest.spyOn(utils, "getCurrentTimestamp").mockReturnValue(
      new Date("2026-01-18T10:00:00")
    );
    resetTemperatureExtrema();
    const mockRetrieve = jest.fn().mockReturnValue(undefined);
  
    // act
    retrieveCurrentTemperatureExtrema(mockRetrieve);
    
    // assert
    const extrema = getTemperatureExtrema();
    // values should remain whatever they were before
    expect(extrema.minTemp).toBeNull();
    expect(extrema.maxTemp).toBeNull();
  })
});