import React, { useEffect, useState } from 'react';
import './App.css';
import { formatTemperature, formatHumidity, formatLastUpdate, formatExtremeReading, formatLocalTime12h } from './utils/formatters';
import config from "../../config/config.json";
import Panel from './components/Panel';
import YearToDate from './components/YearToDate';
import MonthlyAlmanac from './components/MonthlyAlmanac';
import DailyWeatherTable from './components/DailyWeatherTable';
import ExportMonth from './components/ExportMonth';

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
    highestWindGust: null
  });
  const [dailyData, setDailyData] = useState([]);
  const [dailyDataSummary, setDailyDataSummary] = useState([]);
  const [yearToDateSummary, setYearToDateSummary] = useState([]);
  const [monthlyAlmanac, setMonthlyAlmanac] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource('/api/update-events-sse');

    eventSource.onmessage = function(event) {
      const data = JSON.parse(event.data);

      setObservations({
        temperature: `${formatTemperature(data.temp)}`,
        humidity: `${formatHumidity(data.humidity)}`,
        dewPoint: `${formatTemperature(data.dewPoint)}`,
        highTemp: `${formatExtremeReading(formatTemperature(data.maxTemp), formatLocalTime12h(data.maxTempAt))}`,
        lowTemp: `${formatExtremeReading(formatTemperature(data.minTemp), formatLocalTime12h(data.minTempAt))}`,
        lastUpdateTempAndHumidity: `${formatLastUpdate(formatLocalTime12h(data.timestamp))}`
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

  useEffect(() => {
    async function fetchYearToDateSummary() {
      const dataResponse = await fetch('/api/climatology/year-to-date');
      const data = await dataResponse.json();

      setYearToDateSummary(data);
    }

    fetchYearToDateSummary();
  }, []);

  useEffect(() => {
    async function fetchMonthlyAlmanac() {
      const dataResponse = await fetch('/api/climatology/monthly-almanac');
      const data = await dataResponse.json();

      setMonthlyAlmanac(data);
    }

    fetchMonthlyAlmanac();
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
          <Panel title='Temperature' value={observations.temperature} 
                  extras={{ "Max": observations.highTemp, "Min": observations.lowTemp }} updateTime={observations.lastUpdateTempAndHumidity}/>
          <Panel title='Humidity' value={observations.humidity} updateTime={observations.lastUpdateTempAndHumidity}
                  extras={{ "Dew Point": observations.dewPoint}}/>
          <Panel title="MSL Pressure" value={observations.mslPressure} updateTime={observations.lastUpdateMslPressure}/>
        </div>
        
        <DailyWeatherTable data={dailyData.data} summary={dailyDataSummary}></DailyWeatherTable>

        <MonthlyAlmanac data={monthlyAlmanac}></MonthlyAlmanac>

        <YearToDate data={yearToDateSummary}></YearToDate>

        <ExportMonth></ExportMonth>
      </div>
    </div>
  );
}

export default App;