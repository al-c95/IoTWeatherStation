import React, { useEffect, useState } from 'react';
import Panel from './components/Panel';
import DailyWeatherTable from './components/DailyWeatherTable';
import ExportMonth from './components/ExportMonth';
import './App.css';
import { formatTemperature, formatHumidity, formatLastUpdate, formatExtremeReading } from './utils/formatters';
import config from "../../config/config.json";

function App() {
  const [observations, setObservations] = useState({
    temperature: null,
    highTemp: null,
    lowTemp: null,
    humidity: null,
    dewPoint: null,
    lastUpdateTempAndHumidity: null,
    windSpeed: null,
    windDirection: null,
    lastUpdateWind: null,
    sustainedWind: null,
    windGusts: null,
    highestWindGust: null
  });
  const [dailyData, setDailyData] = useState([]);
  const [dailyDataSummary, setDailyDataSummary] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource('/api/update-events-sse');

    eventSource.onmessage = function(event) {
      const data = JSON.parse(event.data);

      setObservations({
        temperature: `${formatTemperature(data.temp)}`,
        humidity: `${formatHumidity(data.humidity)}`,
        dewPoint: `${formatTemperature(data.dewPoint)}`,
        highTemp: `${formatExtremeReading(formatTemperature(data.maxTemp), data.maxTempAt)}`,
        lowTemp: `${formatExtremeReading(formatTemperature(data.minTemp), data.minTempAt)}`,
        lastUpdateTempAndHumidity: `${formatLastUpdate(data.timestamp)}`
      });
    }

    return() => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    async function fetchDailyData() {
      const dataResponse = await fetch('/api/daily-observations?days=5');
      const data = await dataResponse.json();

      setDailyData(data);
    }

    fetchDailyData();
  }, []);

  useEffect(() => {
    async function fetchDailyDataSummary() {
      //const summaryResponse = await fetch('/api/ai/summarise-last-five-days');
      //const summary = await summaryResponse.json();

      //setDailyDataSummary(summary);
      setDailyDataSummary('summary');
    }

    fetchDailyDataSummary();
  }, []);

  return (
    <div>
      <div className='container'>
        <h1>Local Weather</h1>
        <div>{config.station_name}</div>
        <div>{config.altitude} m</div>
        <div>{config.latitude} {config.longitude}</div>

        <h2>Current Conditions</h2>
        <div className='grid'>
          <Panel title='Temperature' value={observations.temperature ?? '-'} 
                  extras={{ "Max": observations.highTemp, "Min": observations.lowTemp }} updateTime={observations.lastUpdateTempAndHumidity}/>
          <Panel title='Humidity' value={observations.humidity ?? '-' } updateTime={observations.lastUpdateTempAndHumidity}
                  extras={{ "Dew Point": observations.dewPoint ?? '-' }}/>
        </div>
        
        <ExportMonth></ExportMonth>          

        <DailyWeatherTable data={dailyData.data} summary={dailyDataSummary}></DailyWeatherTable>
      </div>
    </div>
  );
}

export default App;