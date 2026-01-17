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
  it("temperature and humidity valid updates observations", () => {
    // arrange
    const now = new Date();

    // act
    updateCurrentObservations(25, 50, now);

    // assert
    expect(getCurrentObservations().temp).toBe(25);
    expect(getCurrentObservations().humidity).toBe(50);
    expect(getCurrentObservations().dewPoint).toBeCloseTo(13.9,1);
  })

  it("temperature valid humidity invalid updates observations", () => {
    // arrange
    const now = new Date();

    // act
    updateCurrentObservations(25, -1, now);

    // assert
    expect(getCurrentObservations().temp).toBe(25);
    expect(getCurrentObservations().humidity).toBe(null);
    expect(getCurrentObservations().dewPoint).toBe(null);
  })

  it("temperature invalid humidity valid updates observations", () => {
    // arrange
    const now = new Date();

    // act
    updateCurrentObservations(-45, 50, now);

    // assert
    expect(getCurrentObservations().temp).toBe(null);
    expect(getCurrentObservations().humidity).toBe(50);
    expect(getCurrentObservations().dewPoint).toBe(null);
  })
});

describe("getSseUpdateData", () => {
  it("updates sse", () => {
    // arrange
    const now = new Date();
    updateCurrentObservations(25, 50, now);
    updateTemperatureExtrema(25, now);
    updateCurrentObservations(27, 50, new Date());
    updateTemperatureExtrema(27, new Date());

    // act
    const data = getSseUpdateData();

    // assert
    expect(data.temp).toBe(27);
    expect(data.humidity).toBe(50);
    expect(data.minTemp).toBe(25);
    expect(data.maxTemp).toBe(27);
  })
})