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

export function formatMslPressureReading(value)
{
  if (isNullish(value))
  {
    return '-';
  }

  return `${value} hPa`;
}

export function formatLocalTime12h(utcTimestamp)
{
  if (isNullish(utcTimestamp))
  {
    return '-';
  }

  if (utcTimestamp === '-')
  {
    return '-';
  }

  const date = new Date(utcTimestamp);

  return new Intl.DateTimeFormat(undefined,
  {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}