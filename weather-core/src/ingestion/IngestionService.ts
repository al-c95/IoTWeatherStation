import { broadcastSseEvent } from "../sseBroadcaster";
import { getSseUpdateData } from "../currentData";
import AlertEngine from "../alerts/AlertEngine";

abstract class IngestionService<TObservations> {

    protected readonly alertEngine: AlertEngine<TObservations>;

    constructor(alertEngine: AlertEngine<TObservations>) {
        this.alertEngine = alertEngine;
    }

    protected abstract runPipeline(observations: TObservations): Promise<void>;
    
    async execute(observations: TObservations): Promise<void> {
        await this.runPipeline(observations);
        await this.alertEngine.processObservations(observations);
        broadcastSseEvent(getSseUpdateData());
    }
}

export default IngestionService;