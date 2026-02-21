import NotificationChannel from "./NotificationChannel";

abstract class Alert<TObservations>
{
    private readonly _channels: NotificationChannel[];
    private _isActive: boolean;
    private _expiryTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly _title: string;
    protected readonly _message: string;
    private readonly _cooldownMillis: number;

    constructor(title: string, message: string, channels: NotificationChannel[], cooldownMillis: number) {
        this._channels = channels;
        this._isActive = false;
        this._title = title;
        this._message=message;
        this._cooldownMillis=cooldownMillis;
    }

    isActive(): boolean
    {
        return this._isActive;
    }

    protected abstract evaluate(observations: TObservations): boolean;

    async processObservations(observations: TObservations)
    {
        if (this._isActive)
        {
            return;
        }

        if (!this.evaluate(observations))
        {
            return;
        }

        await Promise.all(this._channels.map(c => c.send(this._title, this._message)));

        this._isActive=true;
        if (this._expiryTimer) {
            clearTimeout(this._expiryTimer);
        }
        this._expiryTimer = setTimeout(() => {
            this._isActive=false;
            this._expiryTimer=null;
        }, this._cooldownMillis);
    }

    dispose(): void
    {
        if (this._expiryTimer)
        {
            clearTimeout(this._expiryTimer);
            this._expiryTimer=null;
        }
    }
}

export default Alert;