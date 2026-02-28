import AlertConfig from "../types/AlertConfig";
import TemperatureAlert from "./TemperatureAlert";
import EmailNotificationChannel from "./EmailNotificationChannel";

function temperatureAlertFactory(
    alertsConfig: AlertConfig[]
): TemperatureAlert[] {

    return alertsConfig
        .filter(a => a.type === "temperature")
        .map(a => new TemperatureAlert(
            a.threshold,
            a.trend,
            [new EmailNotificationChannel([...a.recipients])]
        ));
}

export default temperatureAlertFactory;