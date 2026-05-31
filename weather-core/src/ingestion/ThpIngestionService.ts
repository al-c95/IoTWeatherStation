import IngestionService from "./IngestionService";
import ThpObservations from "../types/ThpObservations";
import { updateCurrentThpObservations } from "../currentConditions/currentData";
import { getCurrentObservations } from "../currentConditions/currentData";
import { retrieveCurrentTemperatureExtrema } from "../currentConditions/currentData";
import { persistObservations } from "../db";
import AlertEngine from "../alerts/AlertEngine";

class ThpIngestionService extends IngestionService<ThpObservations> {

    constructor(alertEngine: AlertEngine<ThpObservations>) {
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