import { Temperature, NullableDate } from "./DailyWeather";

type DailyTemperatureExtrema = {
    minTemp: Temperature;
    minTempAt: NullableDate;
    maxTemp: Temperature;
    maxTempAt: NullableDate;
};

export default DailyTemperatureExtrema;