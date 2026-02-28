import AlertConfig from "../types/AlertConfig";
import TemperatureAlert from "./TemperatureAlert";
import NotificationChannel from "./NotificationChannel";
import EmailNotificationChannel from "./EmailNotificationChannel";

function temperatureAlertFactory(alertsConfig: AlertConfig[]): TemperatureAlert[] {
    let alerts: TemperatureAlert[] = [];
    for (const alert of alertsConfig) {
        if (alert.type === 'temperature')
        {
            const notificationChannels: NotificationChannel[] = [];
            const emails = [...alert.recipients];

            notificationChannels.push(
                new EmailNotificationChannel(emails)
            );

            const temperatureAlert = new TemperatureAlert(
                alert.threshold,
                alert.trend,
                notificationChannels
            );

            alerts.push(temperatureAlert);
        }
    }

    return alerts;
}

export default temperatureAlertFactory;