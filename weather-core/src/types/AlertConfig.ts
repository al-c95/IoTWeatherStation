import TrendDirection from "./TrendDirection"

interface AlertConfig {
    type: string,
    trend: TrendDirection,
    threshold: number,
    recipients: string[]
}

export default AlertConfig;