import { Temperature, Humidity, Pressure, NullableDate } from "./DailyWeather";

type CurrentObservations = {
    temp: Temperature;
    humidity: Humidity;
    dewPoint: Temperature;
    mslPressure: Pressure,
    timestamp: NullableDate;
  };

export default CurrentObservations;