import React, { useEffect, useState } from 'react';
import Panel from './components/Panel';
import './App.css';

function App() {
  const [observations, setObservations] = useState({
    temperature: null,
    highTemp: null,
    lowTemp: null,
    humidity: null,
    lastUpdateTempAndHumidity: null,
    windSpeed: null,
    windDirection: null,
    lastUpdateWind: null
  });

  useEffect(() => {
    const eventSource = new EventSource('/update-events-sse');

    eventSource.onmessage = function(event) {
      const data = JSON.parse(event.data);

      setObservations({
        temperature: `${data.temperature.toFixed(1)}°C`,
        humidity: `${data.humidity}%`,
        lastUpdateTempAndHumidity: `Last updated at: ${data.last_update_temperature_and_humidity}`,
        highTemp: `${data.high_temperature} ${data.high_temperature_time}`,
        lowTemp: `${data.low_temperature} ${data.low_temperature_time}`,
        windSpeed: `${data.wind_speed} km/h`,
        windDirection: `${data.wind_direction}°`,
        lastUpdateWind: `Last updated at: ${data.last_update_wind_speed}`
      });
    }

    return() => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <div className='container'>
        <h1>Current Conditions</h1>
        <div>9/13 Curzon St, Ryde</div>

        <div className='grid'>
          <Panel title='Temperature' value={observations.temperature ?? '-'} 
                  extras={{ "Max": observations.highTemp, "Min": observations.lowTemp }} updateTime={observations.lastUpdateTempAndHumidity}/>
          <Panel title='Humidity' value={observations.humidity ?? '-' } updateTime={observations.lastUpdateTempAndHumidity}/>
          <Panel title='Wind' value={`${observations.windDirection} ${observations.windSpeed}` ?? '-' } updateTime={observations.lastUpdateWind}/>
        </div>
      </div>
    </div>
  );
}

export default App;