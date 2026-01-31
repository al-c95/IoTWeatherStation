import React from 'react';
import { formatDayAndMonth, formatTemperature } from '../utils/formatters';

function MonthlyAlmanac({data}) {
    return(
        <div className="monthly-almanac">
            <h2>Almanac for Current Month</h2>

            <div>Highest temperature: {formatTemperature(data.maxTemp)} {(formatDayAndMonth(data.maxTempAt))}</div>
            <div>Lowest temperature: {formatTemperature(data.minTemp)} {(formatDayAndMonth(data.minTempAt))}</div>
        </div>
    );
}

export default MonthlyAlmanac;