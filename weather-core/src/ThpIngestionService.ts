import IngestionService from "./IngestionService";
import ThpObservations from "./types/ThpObservations";
import TemperatureAlertEngine from "./alerts/TemperatureAlertEngine";
import { updateCurrentThpObservations } from "./currentData";
import { getCurrentObservations } from "./currentData";
import { retrieveCurrentTemperatureExtrema } from "./currentData";
import { persistObservations } from "./db";

class ThpIngestionService extends IngestionService<ThpObservations> {

    constructor(alertEngine: TemperatureAlertEngine) {
        super(alertEngine);
    }

    protected async runPipeline(observations: ThpObservations): Promise<void> {
        updateCurrentThpObservations(observations);
        persistObservations(observations.timestamp, 
            getCurrentObservations().temp, 
            getCurrentObservations().humidity, 
            getCurrentObservations().mslPressure);
        retrieveCurrentTemperatureExtrema();
    }

}

export default ThpIngestionService;