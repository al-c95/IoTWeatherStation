import ThpObservations from "../types/ThpObservations";
import TemperatureAlert from "./TemperatureAlert";
import { AppLogger, getLogger } from "../logger";
import AlertEngine from "./AlertEngine";

class TemperatureAlertEngine implements AlertEngine<ThpObservations>
{
    private alerts: TemperatureAlert[];
    protected readonly _logger: AppLogger;

    constructor(alerts: TemperatureAlert[]) {
        this.alerts = alerts;
        this._logger = getLogger(this.constructor.name);

        this._logger.info("TemperatureAlertEngine initialized", {
            alertCount: this.alerts.length,
        });
    }

    async processObservations(observations: ThpObservations): Promise<void>
    {
        this._logger.trace("Dispatching observations to alerts", {
            alertCount: this.alerts.length,
            temperature: observations.temperature,
        });

        for (const alert of this.alerts)
        {
            try {
                await alert.processObservations(observations);
            } 
            catch (err) {
                this._logger.error("Alert processing failed", { err });
            }
        }
    }

    dispose(): void {
        this._logger.info("Disposing TemperatureAlertEngine", {
            alertCount: this.alerts.length,
        });

        for (const alert of this.alerts){
            alert.dispose();
        }

        this._logger.debug("TemperatureAlertEngine disposed");
    }
};

export default TemperatureAlertEngine;