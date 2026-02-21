import CurrentObservations from "./CurrentObservations";
import DailyTemperatureExtrema from "./DailyTemperatureExtrema";

type SseUpdateData = CurrentObservations & DailyTemperatureExtrema;

export default SseUpdateData;