import { Temperature, Humidity, Pressure, NullableDate, Precipitation } from "./DailyWeather";

type CurrentObservations = {
    temp: Temperature;
    humidity: Humidity;
    dewPoint: Temperature;
    mslPressure: Pressure;
    totalPrecipitation: Precipitation;
    timestamp: NullableDate;
  };

export default CurrentObservations;