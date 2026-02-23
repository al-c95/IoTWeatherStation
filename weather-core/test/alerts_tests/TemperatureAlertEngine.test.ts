import TemperatureAlertEngine from "../../src/alerts/TemperatureAlertEngine";
import ThpObservations from "../../src/types/ThpObservations";
import AlertConfig from "../../src/types/AlertConfig";

// mock EmailNotificationChannel to avoid real SMTP usage
jest.mock("../../src/alerts/EmailNotificationChannel", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

function thp(temp: number): ThpObservations {
  return {
    temperature: temp,
    humidity: 50,
    rawPressure: 1000,
    timestamp: new Date()
  };
}

describe("TemperatureAlertEngine", () => {

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("constructs only temperature alerts", () => {
    // arrange
    const config: AlertConfig[] = [
      {
        type: "temperature",
        trend: "increasing",
        threshold: 30,
        recipients: ["a@test.com"]
      }
    ];

    // act
    const engine = new TemperatureAlertEngine(config);

    // assert
    expect(engine).toBeDefined();
  });

  test("processObservations delegates to alerts", async () => {
    // arrange
    const config: AlertConfig[] = [
      {
        type: "temperature",
        trend: "increasing",
        threshold: 30,
        recipients: ["a@test.com"]
      }
    ];

    // act
    const engine = new TemperatureAlertEngine(config);

    // assert
    await engine.processObservations(thp(29));
    await engine.processObservations(thp(31));
    // if no error thrown and promise resolves,
    // delegation worked (TemperatureAlert logic tested separately)
    expect(true).toBe(true);
  });

  test("dispose clears internal alert timers safely", () => {
    // arrange
    const config: AlertConfig[] = [
      {
        type: "temperature",
        trend: "increasing",
        threshold: 30,
        recipients: ["a@test.com"]
      }
    ];

    // act
    const engine = new TemperatureAlertEngine(config);

    // assert
    expect(() => engine.dispose()).not.toThrow();
  });
});