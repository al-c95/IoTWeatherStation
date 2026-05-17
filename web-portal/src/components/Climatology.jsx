import React, { useEffect, useState } from 'react';

function Climatology() {
  const [climatology, setClimatology] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchClimatology() {
      try {
        setError(null);

        const response = await fetch('/analysis-api/climatology/full-monthly');

        if (!response.ok) {
          throw new Error(`Failed to fetch climatology: HTTP ${response.status}`);
        }

        const data = await response.json();
        setClimatology(data);
      } 
      catch (err) {
        console.error('Error fetching climatology:', err);
        setError(err.message);
      }
    }

    fetchClimatology();
  }, []);

  const months = climatology?.months ?? [];

  return (
    <div>
      <h2>Climatology</h2>

      {error && (
        <div style={{ color: '#c00', marginBottom: '1rem' }}>
          Error: {error}
        </div>
      )}

      {!error && !climatology && (
        <div>Loading climatology...</div>
      )}

      {months.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Mean min</th>
                <th>Mean daily</th>
                <th>Mean max</th>
                <th>Lowest min</th>
                <th>Highest min</th>
                <th>Lowest max</th>
                <th>Highest max</th>
                <th>D1 min</th>
                <th>D1 max</th>
                <th>D9 min</th>
                <th>D9 max</th>
                <th>≤0°C days</th>
                <th>≤2°C days</th>
                <th>≤5°C days</th>
                <th>≥30°C days</th>
                <th>≥35°C days</th>
                <th>≥40°C days</th>
              </tr>
            </thead>

            <tbody>
              {months.map((month) => {
                const stats = month.statistics;

                return (
                  <tr key={month.month}>
                    <td>{month.month_name}</td>

                    {!stats ? (
                      <td colSpan={17}>No data</td>
                    ) : (
                      <>
                        <td>{stats.mean_min_temp}</td>
                        <td>{stats.mean_daily_temp}</td>
                        <td>{stats.mean_max_temp}</td>

                        <td>{stats.lowest_min_temp.value} ({stats.lowest_min_temp.date})</td>
                        <td>{stats.highest_min_temp.value} ({stats.highest_min_temp.date})</td>
                        <td>{stats.lowest_max_temp.value} ({stats.lowest_max_temp.date})</td>
                        <td>{stats.highest_max_temp.value} ({stats.highest_max_temp.date})</td>

                        <td>{stats.decile_1_min_temp}</td>
                        <td>{stats.decile_1_max_temp}</td>
                        <td>{stats.decile_9_min_temp}</td>
                        <td>{stats.decile_9_max_temp}</td>

                        <td>{stats.mean_days_min_lte_0}</td>
                        <td>{stats.mean_days_min_lte_2}</td>
                        <td>{stats.mean_days_min_lte_5}</td>
                        <td>{stats.mean_days_max_gte_30}</td>
                        <td>{stats.mean_days_max_gte_35}</td>
                        <td>{stats.mean_days_max_gte_40}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Climatology;