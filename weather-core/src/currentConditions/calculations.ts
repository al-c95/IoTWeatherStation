export function calculateMslp(rawPressure: number, elevation: number) {
    // simplified barometric formula
    return rawPressure * Math.pow(1 - elevation / 44330, -5.255);
}

export function calculateDewPoint(temperature: number, humidity: number) {
    // Magnus-Tetens approximation
    const a = 17.62;
    const b = 243.12;

    const gamma = Math.log(humidity / 100) +(a * temperature) / (b + temperature);
    const dewPoint = (b * gamma) / (a - gamma);

    return dewPoint;
}