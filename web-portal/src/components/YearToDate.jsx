import React from 'react';
import { formatDayAndMonth, formatTemperature, formatPrecipitation } from '../utils/formatters';

function YearToDate({data}) {
    return(
        <div className="year-to-date">
            <h2>Year to Date</h2>

            <div>Highest temperature: {formatTemperature(data.maxTemp)} {(formatDayAndMonth(data.maxTempAt))}</div>
            <div>Lowest temperature: {formatTemperature(data.minTemp)} {(formatDayAndMonth(data.minTempAt))}</div>
            <div>Total rainfall: {formatPrecipitation(data.totalPrecipitation)}</div>
        </div>
    );
}

export default YearToDate;