import { broadcastSseEvent } from "./sseBroadcaster";
import { getSseUpdateData } from "./currentData";

abstract class IngestionService<TObservations> {

    protected _alertEngine: any;

    constructor(alertEngine: any) {
        this._alertEngine=alertEngine;
    }

    protected abstract runPipeline(observations: TObservations): Promise<void>;
    
    async execute(observations: TObservations): Promise<void> {
        await this.runPipeline(observations);
        await this._alertEngine.processObservations(observations);
        broadcastSseEvent(getSseUpdateData());
    }
}

export default IngestionService;