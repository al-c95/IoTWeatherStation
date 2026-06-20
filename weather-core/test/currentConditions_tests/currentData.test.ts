import {getTemperatureExtrema, resetTemperatureExtrema, updateCurrentThpObservations, getCurrentObservations, getSseUpdateData, retrieveCurrentTemperatureExtrema, resetRain} from "../../src/currentConditions/currentData";
import ThpObservations from "../../src/types/ThpObservations";
import RainObservations from "../../src/types/RainObservations";
import * as utils from "../../src/utils";

jest.mock("../../../config/config.json", () => ({
  elevation: 0
}));

describe("updateCurrentObservations", () => {
  it("temperature and humidity and pressure valid updates observations", () => {
    // arrange
    const now = new Date();
    const observations: ThpObservations = {
      timestamp:now,
      temperature: 25,
      humidity: 50,
      rawPressure: 1000
    };

    // act
    updateCurrentThpObservations(observations);

    // assert
    expect(getCurrentObservations().thp.temp).toBe(25);
    expect(getCurrentObservations().thp.humidity).toBe(50);
    expect(getCurrentObservations().thp.dewPoint).toBeCloseTo(13.9,1);
    expect(getCurrentObservations().thp.mslPressure).toBe(1000);
    expect(getCurrentObservations().precipitation.totalPrecipitation).toBeNull();
  })

  it("temperature valid humidity invalid updates observations", () => {
    // arrange
    const now = new Date();
    const observations: ThpObservations = {
      timestamp:now,
      temperature: 25,
      humidity: -1,
      rawPressure: 1000
    };

    // act
    updateCurrentThpObservations(observations);

    // assert
    expect(getCurrentObservations().thp.temp).toBe(25);
    expect(getCurrentObservations().thp.humidity).toBe(null);
    expect(getCurrentObservations().thp.dewPoint).toBe(null);
    expect(getCurrentObservations().thp.mslPressure).toBe(1000);
    expect(getCurrentObservations().precipitation.totalPrecipitation).toBeNull();
  })

  it("temperature invalid humidity valid updates observations", () => {
    // arrange
    const now = new Date();
    const observations: ThpObservations = {
      timestamp:now,
      temperature: -45,
      humidity: 50,
      rawPressure: 1000
    };

    // act
    updateCurrentThpObservations(observations);

    // assert
    expect(getCurrentObservations().thp.temp).toBe(null);
    expect(getCurrentObservations().thp.humidity).toBe(50);
    expect(getCurrentObservations().thp.dewPoint).toBe(null);
    expect(getCurrentObservations().thp.mslPressure).toBe(1000);
    expect(getCurrentObservations().precipitation.totalPrecipitation).toBeNull();
  })
});

describe("getSseUpdateData", () => {
  it("updates sse", () => {
    // arrange
    const now = new Date();
    const observations: ThpObservations = {
      timestamp:now,
      temperature: 27,
      humidity: 50,
      rawPressure: 1000
    };
    updateCurrentThpObservations(observations);
    observations.timestamp = new Date();
    updateCurrentThpObservations(observations);

    // act
    const data = getSseUpdateData();

    // assert
    expect(data.thp.temp).toBe(27);
    expect(data.thp.humidity).toBe(50);
    expect(data.minTemp).toBe(null);
    expect(data.minTempAt).toBe(null);
    expect(data.maxTemp).toBe(null);
    expect(data.maxTempAt).toBe(null);
    expect(data.thp.mslPressure).toBe(1000);
    expect(data.thp.dewPoint).toBeCloseTo(15.7,1);
    expect(data.precipitation.totalPrecipitation).toBeNull();
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