export function validateRange(value: number, lowerBound: number, upperBound: number): boolean {
    if (value >= lowerBound && value <= upperBound) {
        return true;
    }
    return false;
}

export function sanitiseTemperature(temperature: number) {
    return validateRange(temperature, -40, 60);
}

export function sanitiseHumidity(humidity: number) {
    return validateRange(humidity, 0, 100);
}