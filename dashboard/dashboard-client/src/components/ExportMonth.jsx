import React, { useState } from 'react';

function ExportMonth() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="export-month">
      <h2>Export Month</h2>

      <label>
        Month:&nbsp;
        <select
          value={month}
          onChange={e => setMonth(parseInt(e.target.value, 10))}>
          {monthNames.map((name, i) => (
            <option key={i+1} value={i+1}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Year:&nbsp;
        <input
            type="number"
            value={year}>
        </input>
      </label>

      <button>Export XLSX</button>
    </div>
  );
}

export default ExportMonth;