import React, { useEffect, useState } from 'react';
import Panel from './components/Panel';
import DailyWeatherTable from './components/DailyWeatherTable';
import './App.css';
import { formatTemperature, formatWindSpeed, formatHumidity, formatLastUpdate, formatExtremeReading } from './utils/formatters'

function App() {
  const [observations, setObservations] = useState({
    temperature: null,
    highTemp: null,
    lowTemp: null,
    humidity: null,
    lastUpdateTempAndHumidity: null,
    windSpeed: null,
    windDirection: null,
    lastUpdateWind: null,
    sustainedWind: null,
    windGusts: null,
    highestWindGust: null
  });
  const [dailyData, setDailyData] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource('/update-events-sse');

    eventSource.onmessage = function(event) {
      const data = JSON.parse(event.data);

      setObservations({
        temperature: `${formatTemperature(data.temperature)}`,
        humidity: `${formatHumidity(data.humidity)}`,
        highTemp: `${formatExtremeReading(formatTemperature(data.high_temperature), data.high_temperature_time)}`,
        lowTemp: `${formatExtremeReading(formatTemperature(data.low_temperature), data.low_temperature_time)}`,
        lastUpdateTempAndHumidity: `${formatLastUpdate(data.last_update_temperature_and_humidity)}`,   
        windSpeed: `${formatWindSpeed(data.wind_speed)}`,
        windDirection: `${data.wind_direction}`,
        sustainedWind: `${formatWindSpeed(data.sustained_wind)}`,
        windGusts: `${formatWindSpeed(data.wind_gusts)}`,
        lastUpdateWind: `${formatLastUpdate(data.last_update_wind_speed)}`,
        highestWindGust: `${data.highest_wind_gust_direction} ${formatExtremeReading(formatWindSpeed(data.highest_wind_gust), data.highest_wind_gust_time)}`,     
      });
    }

    return() => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    async function fetchDailyData() {
      const response = await fetch('http://localhost:8000/last-five-days');
      const data = await response.json();

      setDailyData(data);
    }

    fetchDailyData();
  }, []);

  return (
    <div>
      <div className='container'>
        <h1>Local Weather</h1>
        <div>My Location</div>

        <h2>Current Conditions</h2>
        <div className='grid'>
          <Panel title='Temperature' value={observations.temperature ?? '-'} 
                  extras={{ "Max": observations.highTemp, "Min": observations.lowTemp }} updateTime={observations.lastUpdateTempAndHumidity}/>
          <Panel title='Humidity' value={observations.humidity ?? '-' } updateTime={observations.lastUpdateTempAndHumidity}/>
          <Panel title='Wind' value={`${observations.windDirection} ${observations.windSpeed}` ?? '-' }
                  extras={{
                    "Sustained": observations.sustainedWind,
                    "Gusts": observations.windGusts,
                    "Highest gust": observations.highestWindGust }} 
                  updateTime={observations.lastUpdateWind}/>
        </div>

        <h2>Last 5 Days</h2>
        <DailyWeatherTable data={dailyData}></DailyWeatherTable>
      </div>
    </div>
  );
}

export default App;