import AlertConfig from "../types/AlertConfig";
import ThpObservations from "../types/ThpObservations";
import EmailNotificationChannel from "./EmailNotificationChannel";
import NotificationChannel from "./NotificationChannel";
import TemperatureAlert from "./TemperatureAlert";

class TemperatureAlertEngine
{
    private alerts: TemperatureAlert[];

    constructor(alertsConfig: AlertConfig[]) {
        this.alerts=[];
        for (const alertConfig of alertsConfig)
        {
            if (alertConfig.type==='temperature'){
                const notificationChannels: NotificationChannel[] = [];
                const emails = [...alertConfig.recipients];
                notificationChannels.push(new EmailNotificationChannel(emails));
                const temperatureAlert: TemperatureAlert = new TemperatureAlert(alertConfig.threshold, alertConfig.trend, notificationChannels);

                this.alerts.push(temperatureAlert);
            }
        }
    }

    async processObservations(observations: ThpObservations)
    {
        for (const alert of this.alerts)
        {
            await alert.processObservations(observations);
        }
    }

    dispose(): void {
        for (const alert of this.alerts){
            alert.dispose();
        }
    }
};

export default TemperatureAlertEngine;