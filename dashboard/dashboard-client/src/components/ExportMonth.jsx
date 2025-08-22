import React, { useState } from 'react';

function ExportMonth() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleExport = async () => {
    try
    {
      const response = await fetch(`http://localhost:8000/export/month?year=${year}&month=${month}`);
      if (!response.ok)
      {
        alert("Export failed!");
        return;
      }
      const blob = await response.blob();
      const filename = `weather_${year}-${String(month).padStart(2, "0")}.xlsx`;

      // create a temporary link for download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    }
    catch (err)
    {
      console.error(err);
      alert("Error while exporting");
    }
  };

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

      <button onClick={handleExport}>Export XLSX</button>
    </div>
  );
}

export default ExportMonth;