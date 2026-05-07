import Observations from "./Observations";

interface RainObservations extends Observations {
    tips: { timestamp: Date }[];
}

export default RainObservations;