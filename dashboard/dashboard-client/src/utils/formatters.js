export function formatTemperature(temperature) {
    return `${temperature.toFixed(1)}°C`;
}
  
export function formatWindSpeed(windSpeed) {
    return `${windSpeed} km/h`;
}
  
export function formatHumidity(humidity) {
    return `${humidity}%`;
}
  
export function formatLastUpdate(timestamp) {
    return `Last updated at: ${timestamp}`;
}
  
export function formatExtremeReading(data, timestamp) {
    return `${data} at ${timestamp}`;
}