import TemperatureAlert from "../../src/alerts/TemperatureAlert"
import NotificationChannel from "../../src/alerts/NotificationChannel";
import ThpObservations from "../../src/types/ThpObservations";

class MockChannel implements NotificationChannel
{
    public send = jest.fn().mockResolvedValue(undefined);
}

function thp(temp: number): ThpObservations {
    return {
      temperature: temp,
      humidity: 50,
      rawPressure: 1000,
      timestamp: new Date()
    };
  }

  describe("TemperatureAlert - increasing", () => {

    let alert: TemperatureAlert;
  
    afterEach(() => {
      if (alert) {
        // clear internal timer
        alert.dispose();
      }
      jest.useRealTimers();
    });
  
    test("does not trigger on first reading", async () => {
      // arrange
      const channel = new MockChannel();
      alert = new TemperatureAlert(30, "increasing", [channel]);
      
      // act
      await alert.processObservations(thp(25));

      // assert
      expect(channel.send).not.toHaveBeenCalled();
    });
  
    test("triggers on upward crossing", async () => {
      // arrange
      const channel = new MockChannel();
      alert = new TemperatureAlert(30, "increasing", [channel]);
  
      // act
      await alert.processObservations(thp(29));
      await alert.processObservations(thp(31));
  
      // assert
      expect(channel.send).toHaveBeenCalledTimes(1);
    });
  
    test("does not retrigger during cooldown", async () => {
      jest.useFakeTimers();
      const channel = new MockChannel();
      alert = new TemperatureAlert(30, "increasing", [channel]);
  
      await alert.processObservations(thp(29));
      await alert.processObservations(thp(31));
  
      expect(channel.send).toHaveBeenCalledTimes(1);
  
      await alert.processObservations(thp(29));
      await alert.processObservations(thp(31));
  
      expect(channel.send).toHaveBeenCalledTimes(1);
    });
  
  });