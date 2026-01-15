function isNullish(value)
{
  return value === null || value === undefined;
}

export function formatTemperature(temp)
{
  if (isNullish(temp))
  {
    return '-';
  }

  return `${temp.toFixed(1)}°C`;
}

export function formatWindSpeed(windSpeed)
{
  if (isNullish(windSpeed))
  {
    return '-';
  }

  return `${windSpeed} km/h`;
}

export function formatHumidity(humidity)
{
  if (isNullish(humidity))
  {
    return '-';
  }

  return `${humidity}%`;
}

export function formatLastUpdate(timestamp)
{
  if (isNullish(timestamp))
  {
    return '-';
  }

  return `Last updated at: ${timestamp}`;
}

export function formatExtremeReading(value, timestamp)
{
  if (isNullish(value) || isNullish(timestamp))
  {
    return '-';
  }

  return `${value} at ${timestamp}`;
}