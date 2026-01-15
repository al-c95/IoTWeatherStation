import {getTemperatureExtrema, updateTemperatureExtrema, resetTemperatureExtrema, updateCurrentObservations, getCurrentObservations, getSseUpdateData} from "../src/currentData";

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
});

describe("updateCurrentObservations", () => {
  it("updates observations", () => {
    // arrange
    const now = new Date();

    // act
    updateCurrentObservations(25, 50, now);

    // assert
    expect(getCurrentObservations().temp).toBe(25);
    expect(getCurrentObservations().humidity).toBe(50);
  })
});

describe("getSseUpdateData", () => {
  it("updates sse", () => {
    // arrange
    const now = new Date();
    updateCurrentObservations(25, 50, now);
    updateCurrentObservations(27, 50, now);

    // act
    const data = getSseUpdateData();

    // assert
    expect(data.temp).toBe(27);
    expect(data.humidity).toBe(50);
    expect(data.minTemp).toBe(25);
    expect(data.maxTemp).toBe(27);
  })
})