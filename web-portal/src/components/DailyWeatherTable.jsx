import React from 'react';
import './DailyWeatherTable.css';
import { formatTemperature } from '../utils/formatters'

function DailyWeatherTable({ data, summary }) {
    
    if (!Array.isArray(data)) {
      return <p>No data available</p>;
    }
  
    return (
      <div>
        <h2>Last 5 Days</h2>
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
              <tr key={`${row.year}-${row.month}-${row.day}`}>
                <td>{row.day}</td>
                <td>{row.month}</td>
                <td>{row.year}</td>
                <td>{formatTemperature(row.minTemp)}</td>
                <td>{formatTemperature(row.maxTemp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
  
        <h3>AI Summary</h3>
        <p>{summary}</p>
      </div>
    );
  }

export default DailyWeatherTable;