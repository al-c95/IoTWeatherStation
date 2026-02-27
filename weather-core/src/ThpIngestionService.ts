import IngestionService from "./IngestionService";
import ThpObservations from "./types/ThpObservations";
import TemperatureAlertEngine from "./alerts/TemperatureAlertEngine";
import config from "../../config/config.json";
import AlertConfig from "./types/AlertConfig";
import { updateCurrentThpObservations } from "./currentData";
import { getCurrentObservations } from "./currentData";
import { retrieveCurrentTemperatureExtrema } from "./currentData";
import { persistObservations } from "./db";

class ThpIngestionService extends IngestionService<ThpObservations> {

    constructor() {
        const alertsConfig = config.alerts as AlertConfig[];
        const temperatureAlertEngine: TemperatureAlertEngine = new TemperatureAlertEngine(alertsConfig);

        super(temperatureAlertEngine);
    }

    protected runPipeline(observations: ThpObservations): void {
        updateCurrentThpObservations(observations);
        persistObservations(observations.timestamp, 
            getCurrentObservations().temp, 
            getCurrentObservations().humidity, 
            getCurrentObservations().mslPressure);
        retrieveCurrentTemperatureExtrema();
    }

}

export default ThpIngestionService;