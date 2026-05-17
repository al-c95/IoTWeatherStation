import React, { useEffect, useState } from 'react';
import './App.css';
import { formatTemperature, formatHumidity, formatLastUpdate, formatExtremeReading, formatLocalTime12h, formatPressure, formatPrecipitation } from './utils/formatters';
import config from "../../config/config.json";
import Panel from './components/Panel';
import YearToDate from './components/YearToDate';
import MonthlyAlmanac from './components/MonthlyAlmanac';
import DailyWeatherTable from './components/DailyWeatherTable';
import ExportMonth from './components/ExportMonth';
import WeatherAiChat from './components/WeatherAiChat';

function App() {
  const [observations, setObservations] = useState({
    temperature: null,
    highTemp: null,
    lowTemp: null,
    humidity: null,
    dewPoint: null,
    lastUpdateTempAndHumidity: null,
    mslPressure: null,
    lastUpdateMslPressure: null,
    windSpeed: null,
    windDirection: null,
    lastUpdateWind: null,
    sustainedWind: null,
    windGusts: null,
    highestWindGust: null,
    rainfall: null,
    lastUpdateRainfall: null
  });
  const [dailyData, setDailyData] = useState([]);
  const [ setDailyDataSummary] = useState([]);
  const [yearToDateSummary, setYearToDateSummary] = useState([]);
  const [monthlyAlmanac, setMonthlyAlmanac] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const eventSource = new EventSource('/core-api/update-events-sse');

    eventSource.onmessage = function(event) {
      const data = JSON.parse(event.data);

      setObservations({
        temperature: `${formatTemperature(data.temp)}`,
        humidity: `${formatHumidity(data.humidity)}`,
        dewPoint: `${formatTemperature(data.dewPoint)}`,
        highTemp: `${formatExtremeReading(formatTemperature(data.maxTemp), formatLocalTime12h(data.maxTempAt))}`,
        lowTemp: `${formatExtremeReading(formatTemperature(data.minTemp), formatLocalTime12h(data.minTempAt))}`,
        lastUpdateTempAndHumidity: `${formatLastUpdate(formatLocalTime12h(data.timestamp))}`,
        mslPressure: `${formatPressure(data.mslPressure)}`,
        lastUpdateMslPressure: `${formatLastUpdate(formatLocalTime12h(data.timestamp))}`,
        rainfall: `${formatPrecipitation(data.totalPrecipitation)}`,
        lastUpdateRainfall: `${formatLastUpdate(formatLocalTime12h(data.timestamp))}`
      });

      console.log(JSON.stringify(data));
    }

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    async function fetchDailyData() {
      try {
        setError(null);
        const response = await fetch('/core-api/daily-observations?days=5');
        if (!response.ok) {
          throw new Error(`Failed to fetch daily data: HTTP ${response.status}`);
        }
        const text = await response.text();
        const data = text ? JSON.parse(text) : [];
        setDailyData(data);
      } 
      catch (err) {
        console.error('Error fetching daily data:', err);
        setError(err.message);
        setDailyData([]);
      }
    }

    fetchDailyData();
  }, []);

  useEffect(() => {
    async function fetchDailyDataSummary() {

      setDailyDataSummary('summary');
    }

    fetchDailyDataSummary();
  }, []);

  useEffect(() => {
    async function fetchYearToDateSummary() {
      try {
        setError(null);
        const response = await fetch('/core-api/climatology/year-to-date');
        if (!response.ok) {
          throw new Error(`Failed to fetch year-to-date data: HTTP ${response.status}`);
        }
        const text = await response.text();
        const data = text ? JSON.parse(text) : [];
        setYearToDateSummary(data);
      } 
      catch (err) {
        console.error('Error fetching year-to-date data:', err);
        setError(err.message);
        setYearToDateSummary([]);
      }
    }

    fetchYearToDateSummary();
  }, []);

  useEffect(() => {
    async function fetchMonthlyAlmanac() {
      try {
        setError(null);
        const response = await fetch('/core-api/climatology/monthly-almanac');
        if (!response.ok) {
          throw new Error(`Failed to fetch monthly almanac: HTTP ${response.status}`);
        }
        const text = await response.text();
        const data = text ? JSON.parse(text) : [];
        setMonthlyAlmanac(data);
      } 
      catch (err) {
        console.error('Error fetching monthly almanac:', err);
        setError(err.message);
        setMonthlyAlmanac([]);
      }
    }

    fetchMonthlyAlmanac();
  }, []);

  return (
    <div>
      {error && <div style={{ backgroundColor: '#fee', color: '#c00', padding: '10px', margin: '10px', borderRadius: '4px' }}>Error: {error}</div>}
      <div className='container'>
        <h1>Local Weather</h1>
        <div>{config.station_name}</div>
        <div>{config.elevation} m</div>
        <div>{config.latitude} {config.longitude}</div>

        <h2>Current Conditions</h2>
        <div className='grid'>
          <Panel title='Temperature' value={observations.temperature} 
                  extras={{ "Max": observations.highTemp, "Min": observations.lowTemp }} updateTime={observations.lastUpdateTempAndHumidity}/>
          <Panel title='Humidity' value={observations.humidity} updateTime={observations.lastUpdateTempAndHumidity}
                  extras={{ "Dew Point": observations.dewPoint}}/>
          <Panel title="MSL Pressure" value={observations.mslPressure} updateTime={observations.lastUpdateMslPressure}/>
          <Panel title="Rainfall" value={observations.rainfall} updateTime={observations.lastUpdateRainfall}/>
        </div>
        
        <DailyWeatherTable data={dailyData.data}></DailyWeatherTable>

        <MonthlyAlmanac data={monthlyAlmanac}></MonthlyAlmanac>

        <YearToDate data={yearToDateSummary}></YearToDate>

        <ExportMonth></ExportMonth>

        <WeatherAiChat></WeatherAiChat>
      </div>
    </div>
  );
}

export default App;