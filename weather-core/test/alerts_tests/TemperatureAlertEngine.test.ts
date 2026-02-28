import TemperatureAlertEngine from "../../src/alerts/TemperatureAlertEngine";
import ThpObservations from "../../src/types/ThpObservations";
import TemperatureAlert from "../../src/alerts/TemperatureAlert";
import { getLogger } from "../../src/logger";

// mock logger
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  error: jest.fn(),
};

// mock getLogger to return our fake logger
jest.mock("../../src/logger", () => ({
  getLogger: jest.fn(),
}));

describe("TemperatureAlertEngine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getLogger as jest.Mock).mockReturnValue(mockLogger);
  });

  const fakeObservations: ThpObservations = {
    temperature: 25,
    humidity: 50,
    rawPressure: 1013,
    timestamp: new Date(),
  };

  function createMockAlert() {
    return {
      processObservations: jest.fn().mockResolvedValue(undefined),
      dispose: jest.fn(),
    } as unknown as TemperatureAlert;
  }

  it("logs initialization with alert count", () => {
    // arrange
    const alerts = [createMockAlert(), createMockAlert()];

    // act
    new TemperatureAlertEngine(alerts);

    // assert
    expect(mockLogger.info).toHaveBeenCalledWith(
      "TemperatureAlertEngine initialized",
      { alertCount: 2 }
    );
  });

  it("dispatches observations to all alerts", async () => {
    // arrange
    const alert1 = createMockAlert();
    const alert2 = createMockAlert();
    const engine = new TemperatureAlertEngine([alert1, alert2]);

    // act
    await engine.processObservations(fakeObservations);

    // assert
    expect(alert1.processObservations).toHaveBeenCalledWith(fakeObservations);
    expect(alert2.processObservations).toHaveBeenCalledWith(fakeObservations);
    expect(mockLogger.trace).toHaveBeenCalledWith(
      "Dispatching observations to alerts",
      expect.objectContaining({
        alertCount: 2,
        temperature: 25,
      })
    );
  });

  it("continues processing if one alert throws", async () => {
    // arrange
    const failingAlert = {
      processObservations: jest.fn().mockRejectedValue(new Error("boom")),
      dispose: jest.fn(),
    } as unknown as TemperatureAlert;
    const workingAlert = createMockAlert();
    const engine = new TemperatureAlertEngine([
      failingAlert,
      workingAlert,
    ]);

    // act
    await engine.processObservations(fakeObservations);

    // assert
    expect(failingAlert.processObservations).toHaveBeenCalled();
    expect(workingAlert.processObservations).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Alert processing failed",
      expect.objectContaining({ err: expect.any(Error) })
    );
  });

  it("dispose calls dispose on all alerts and logs", () => {
    // arrange
    const alert1 = createMockAlert();
    const alert2 = createMockAlert();
    const engine = new TemperatureAlertEngine([alert1, alert2]);

    // act
    engine.dispose();

    // assert
    expect(alert1.dispose).toHaveBeenCalled();
    expect(alert2.dispose).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Disposing TemperatureAlertEngine",
      { alertCount: 2 }
    );
    expect(mockLogger.debug).toHaveBeenCalledWith(
      "TemperatureAlertEngine disposed"
    );
  });
});