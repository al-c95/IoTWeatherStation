import Observations from "./Observations"

interface ThpObservations extends Observations
{
    temperature: number, 
    humidity: number,
    rawPressure: number
}

export default ThpObservations;