import { broadcastSseEvent } from "./sseBroadcaster";
import { getSseUpdateData } from "./currentData";

abstract class IngestionService<TObservations> {

    protected readonly _alertEngine: any;

    constructor(alertEngine: any) {
        this._alertEngine=alertEngine;
    }

    protected abstract runPipeline(observations: TObservations): void;
    
    async execute(observations: TObservations): Promise<void> {
        this.runPipeline(observations);

        broadcastSseEvent(getSseUpdateData());
        await this._alertEngine.processObservations(observations);
    }

    dispose(): void {
        this._alertEngine.dispose();
    }
}

export default IngestionService;