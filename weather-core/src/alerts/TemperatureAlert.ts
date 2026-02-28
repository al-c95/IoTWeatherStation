import Alert from "./Alert"
import NotificationChannel from "./NotificationChannel";
import ThpObservations from "../types/ThpObservations";
import TrendDirection from "../types/TrendDirection";
import { Temperature } from "../types/DailyWeather";

class TemperatureAlert extends Alert<ThpObservations>
{
    private _previousTemp: Temperature;
    private readonly _threshold: number;
    private readonly _trendDirection: TrendDirection;

    constructor(
        threshold: number, 
        trendDirection: TrendDirection, 
        notificationChannels: NotificationChannel[]
    ) {
        super('Temperature alert', `Temperature has reached ${threshold}°C`, notificationChannels, 600000);
        this._previousTemp=null;
        this._threshold=threshold;
        this._trendDirection=trendDirection;
    }

    protected evaluate(obs: ThpObservations): boolean
    {
        const current = obs.temperature;

        if (current === null)
        {
            return false;
        }

        if (this._previousTemp === null) {
            this._previousTemp = current;
            
            return false;
        }

        const crossed =
            this._trendDirection === "increasing"
                ? this._previousTemp <= this._threshold && current >= this._threshold
                : this._previousTemp >= this._threshold && current <= this._threshold;

        this._logger.trace(`Current temperature: ${current}, Previous temperature: ${this._previousTemp}`);

        this._previousTemp = current;

        return crossed;
    }
}

export default TemperatureAlert;