import RainObservations from "../types/RainObservations";
import IngestionService from "./IngestionService";
import { persistRainTips } from "../db";
import { retrieveCurrentTotalRain } from "../currentConditions/currentData";

class RainIngestionService extends IngestionService<RainObservations> {

    constructor() {
        super(null);
        
    }

    protected async runPipeline(observations: RainObservations): Promise<void> {
        persistRainTips(observations.tips);
        retrieveCurrentTotalRain();
    }

}

export default RainIngestionService;