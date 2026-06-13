import { broadcastSseEvent } from "../sseBroadcaster";
import { getSseUpdateData } from "../currentConditions/currentData";
import AlertEngine from "../alerts/AlertEngine";
import { AppLogger, getLogger } from "../logger";

abstract class IngestionService<TObservations> {

    protected readonly alertEngine: AlertEngine<TObservations> | null;
    protected readonly _logger: AppLogger;

    constructor(alertEngine: AlertEngine<TObservations> | null) {
        this.alertEngine = alertEngine;
        this._logger = getLogger('IngestionService');
    }

    protected abstract runPipeline(observations: TObservations): Promise<void>;
    
    async execute(observations: TObservations): Promise<void> {
        await this.runPipeline(observations);

        broadcastSseEvent(getSseUpdateData());

        this.alertEngine?.processObservations(observations).catch((error) => {
            this._logger.error("Alert processing failed", error);
        });
    }
}

export default IngestionService;