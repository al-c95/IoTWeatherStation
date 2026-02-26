import NotificationChannel from "./NotificationChannel";
import { AppLogger, getLogger } from "../logger";

abstract class Alert<TObservations>
{
    private readonly _channels: NotificationChannel[];
    private _isActive: boolean;
    private _expiryTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly _title: string;
    protected readonly _message: string;
    private readonly _cooldownMillis: number;
    protected readonly _logger: AppLogger;

    constructor(title: string, message: string, channels: NotificationChannel[], cooldownMillis: number) {
        this._channels = channels;
        this._isActive = false;
        this._title = title;
        this._message=message;
        this._cooldownMillis=cooldownMillis;

        this._logger = getLogger(this.constructor.name);

        this._logger.debug("Alert constructed", {
            title,
            cooldownMillis,
            channelCount: channels.length,
        });
    }

    isActive(): boolean
    {
        return this._isActive;
    }

    protected abstract evaluate(observations: TObservations): boolean;

    async processObservations(observations: TObservations)
    {
        this._logger.trace("Processing observations");

        if (this._isActive)
        {
            this._logger.trace("Alert skipped because it is active");

            return;
        }

        if (!this.evaluate(observations))
        {
            return;
        }
        this._logger.info("Alert triggered");

        try {
            await Promise.all(this._channels.map(c => c.send(this._title, this._message)));
        }
        catch (err) {
            this._logger.error("Error sending notification", { err });
        }
        
        this._isActive=true;
        if (this._expiryTimer) {
            clearTimeout(this._expiryTimer);
        }
        this._expiryTimer = setTimeout(() => {
            this._isActive=false;
            this._expiryTimer=null;

            this._logger.trace("Alert timer expired");

        }, this._cooldownMillis);
    }

    dispose(): void
    {
        if (this._expiryTimer)
        {
            clearTimeout(this._expiryTimer);
            this._expiryTimer=null;
        }

        this._logger.debug("Alert disposed");
    }
}

export default Alert;