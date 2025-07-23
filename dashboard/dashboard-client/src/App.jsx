import React, { useEffect, useState } from 'react';
import Panel from './components/Panel';
import './App.css';

function App() {
  const [observations, setObservations] = useState({
    temperature: null,
    highTemp: null,
    lowTemp: null,
    humidity: null,
    lastUpdate: null
    
  });

  useEffect(() => {
    const eventSource = new EventSource('/update-events-sse');

    eventSource.onmessage = function(event) {
      const data = JSON.parse(event.data);

      setObservations({
        temperature: `${data.temperature.toFixed(1)}°C`,
        humidity: `${data.humidity}%`,
        lastUpdate: `Last updated at: ${data.last_update}`,
        highTemp: `${data.high_temperature} ${data.high_temperature_time}`,
        lowTemp: `${data.low_temperature} ${data.low_temperature_time}`
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
        <div className='last-update'>{observations.lastUpdate ?? '-'}</div>
        <div className='grid'>
          <Panel title='Temperature' value={observations.temperature ?? '-'} 
                  extras={{ "Max": observations.highTemp, "Min": observations.lowTemp }}/>
          <Panel title='Humidity' value={observations.humidity ?? '-' }/>
        </div>
      </div>
    </div>
  );
}

export default App;