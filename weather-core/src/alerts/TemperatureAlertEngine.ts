import AlertConfig from "../types/AlertConfig";
import ThpObservations from "../types/ThpObservations";
import EmailNotificationChannel from "./EmailNotificationChannel";
import NotificationChannel from "./NotificationChannel";
import TemperatureAlert from "./TemperatureAlert";
import { AppLogger, getLogger } from "../logger";

class TemperatureAlertEngine
{
    private alerts: TemperatureAlert[];
    protected readonly _logger: AppLogger;

    constructor(alertsConfig: AlertConfig[]) {
        this.alerts = [];
        this._logger = getLogger(this.constructor.name);

        this._logger.info("Initializing TemperatureAlertEngine", {
            configCount: alertsConfig.length,
        });

        for (const alertConfig of alertsConfig) {
            if (alertConfig.type === "temperature") {

                this._logger.debug("Creating temperature alert from config", {
                    threshold: alertConfig.threshold,
                    trend: alertConfig.trend,
                    recipients: alertConfig.recipients.length,
                });

                const notificationChannels: NotificationChannel[] = [];
                const emails = [...alertConfig.recipients];

                notificationChannels.push(
                    new EmailNotificationChannel(emails)
                );

                const temperatureAlert = new TemperatureAlert(
                    alertConfig.threshold,
                    alertConfig.trend,
                    notificationChannels
                );

                this.alerts.push(temperatureAlert);
            } else {
                this._logger.warn("Unsupported alert type in config", {
                    type: alertConfig.type,
                });
            }
        }

        this._logger.info("TemperatureAlertEngine initialized", {
            alertCount: this.alerts.length,
        });
    }

    async processObservations(observations: ThpObservations)
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