import React from 'react';
import './DailyWeatherTable.css';
import { formatTemperature } from '../utils/formatters'

function DailyWeatherTable({ data, summary }) {
    return (
        <div>
        <table>
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Month</th>
                    <th>Year</th>
                    <th>Minimum</th>
                    <th>Maximum</th>
                </tr>
            </thead>
            <tbody>
                {data.map((row) => (
                    <tr key={row.id}>
                        <td>{row.day}</td>
                        <td>{row.month}</td>
                        <td>{row.year}</td>
                        <td>{formatTemperature(row.min_temp)}</td>
                        <td>{formatTemperature(row.max_temp)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        <h3>AI Summary</h3>
        <p>{summary}</p>
        </div>
    )
}

export default DailyWeatherTable;