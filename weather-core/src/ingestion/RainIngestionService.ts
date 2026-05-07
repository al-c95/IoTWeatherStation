import RainObservations from "../types/RainObservations";
import IngestionService from "./IngestionService";
import { updateRain } from "../currentData";

class RainIngestionService extends IngestionService<RainObservations> {

    constructor() {
        super(null);
        
    }

    protected async runPipeline(observations: RainObservations): Promise<void> {
        updateRain(observations);
    }

}

export default RainIngestionService;