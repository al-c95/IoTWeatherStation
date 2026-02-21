import {getTemperatureExtrema, resetTemperatureExtrema, updateCurrentThpObservations, getCurrentObservations, getSseUpdateData, retrieveCurrentTemperatureExtrema} from "../src/currentData";
import ThpObservations from "../src/types/ThpObservations";
import * as utils from "../src/utils";

jest.mock("../../config/config.json", () => ({
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
    expect(getCurrentObservations().temp).toBe(25);
    expect(getCurrentObservations().humidity).toBe(50);
    expect(getCurrentObservations().dewPoint).toBeCloseTo(13.9,1);
    expect(getCurrentObservations().mslPressure).toBe(1000);
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
    expect(getCurrentObservations().temp).toBe(25);
    expect(getCurrentObservations().humidity).toBe(null);
    expect(getCurrentObservations().dewPoint).toBe(null);
    expect(getCurrentObservations().mslPressure).toBe(1000);
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
    expect(data.temp).toBe(27);
    expect(data.humidity).toBe(50);
    expect(data.minTemp).toBe(null);
    expect(data.minTempAt).toBe(null);
    expect(data.maxTemp).toBe(null);
    expect(data.maxTempAt).toBe(null);
    expect(data.mslPressure).toBe(1000);
    expect(data.dewPoint).toBeCloseTo(15.7,1);
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