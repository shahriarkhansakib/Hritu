# Guide: Multi-Metric Charting (Dual Y-Axes & Anomalies)

## The Core Problem
When you plot Temperature (e.g., 35°C) and Rainfall (e.g., 1200mm) on the same Y-axis, the chart breaks. The precipitation line shoots to the top, and the temperature line flattens at the bottom. This ruins the "Trend Detective" visual story.

## The Solution
We have implemented **two completely scientifically valid ways** to solve this. Your job is to implement a single `<ChartContainer>` component with a toggle switch so the user can choose how they view the data:

1. **Raw Values (Dual Y-Axes)**: The classic approach. Left axis = °C, Right axis = mm.
2. **Climate Anomalies (Single Y-Axis)**: The "Pro" approach. We subtract the 45-year average from every data point, plotting only the *deviation from normal* (+1.5°C above normal, -200mm below normal). This allows direct visual correlation of extreme events on a single axis centered at `0`.

**Good News:** The backend now calculates all anomalies automatically! You don't need to do any math. Just map the new `anomaly` field provided by the API.

---

## Step 1: The New Data Shape
If you `git pull`, you'll see the backend now returns `anomaly` natively inside `annual_series`, and `baseline_mean` at the root!

```json
{
  "baseline_mean": 24.52,
  "annual_series": [
    { "year": "1981", "value": 24.12, "anomaly": -0.40 },
    { "year": "1982", "value": 25.12, "anomaly": +0.60 }
  ]
}
```
## Step 2: Fetch and Merge (The Protocol)
When a user clicks "Analyze" for a combined view, use `Promise.all` to fetch both metrics. The backend actually downloads all NASA metrics for a region simultaneously and caches them, so firing two requests at once is perfectly optimized.
```tsx
// Inside your React component
import { useState } from 'react';

async function loadCombinedData(lat, lon) {
  // 1. Fetch both simultaneously
  const [tempData, rainData] = await Promise.all([
    fetchTrendData(lat, lon, 'T2M_MAX', 1981, 2026, 'annual'),
    fetchTrendData(lat, lon, 'PRECTOTCORR', 1981, 2026, 'annual')
  ]);

  // 2. Merge them into a single array for Recharts
  const mergedData = tempData.annual_series.map((tPoint) => {
    const rPoint = rainData.annual_series.find(r => r.year === tPoint.year);
    return {
      year: tPoint.year,
      temp_raw: tPoint.value,
      temp_anomaly: tPoint.anomaly,
      rain_raw: rPoint?.value || null,
      rain_anomaly: rPoint?.anomaly || null
    };
  });

  return mergedData; // Store this in your React State!
}
```

## Step 3: Build the Recharts Component with a Toggle
If you are using Recharts (recommended), here is exactly how to build the Chart component that toggles between both scientific views:

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { useState } from 'react';

export default function CombinedChart({ data }) {
  // Toggle State: 'raw' | 'anomaly'
  const [viewMode, setViewMode] = useState('raw');

  return (
    <div className="chart-wrapper" style={{ background: '#1e293b', padding: '20px', borderRadius: '8px' }}>

      {/* The Toggle Button */}
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={() => setViewMode('raw')}
          style={{ background: viewMode === 'raw' ? '#38bdf8' : '#334155', color: '#fff' }}
        >
          Raw Values (Dual Axes)
        </button>
        <button
          onClick={() => setViewMode('anomaly')}
          style={{ background: viewMode === 'anomaly' ? '#38bdf8' : '#334155', color: '#fff', marginLeft: '10px' }}
        >
          Climate Anomalies (Deviations)
        </button>
      </div>

      {/* The Chart */}
      <LineChart width={800} height={400} data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="year" stroke="#94a3b8" />
        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
        <Legend />

        {viewMode === 'raw' ? (
          /* =========================================
             RAW MODE: Dual Y-Axes
             ========================================= */
          <>
            <YAxis yAxisId="left" stroke="#ef4444" />
            <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />

            <Line yAxisId="left" type="monotone" dataKey="temp_raw" stroke="#ef4444" name="Max Temp (°C)" />
            <Line yAxisId="right" type="monotone" dataKey="rain_raw" stroke="#3b82f6" name="Rainfall (mm)" />
          </>
        ) : (
          /* =========================================
             ANOMALY MODE: Single Y-Axis centered at 0
             ========================================= */
          <>
            <YAxis stroke="#cbd5e1" />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" label="Historical Baseline" />

            <Line type="monotone" dataKey="temp_anomaly" stroke="#ef4444" name="Temp Anomaly (°C)" />
            <Line type="monotone" dataKey="rain_anomaly" stroke="#3b82f6" name="Rain Anomaly (mm)" />
          </>
        )}
      </LineChart>

    </div>
  );
}
```

### Why this is a Judge-Winning Strategy
By implementing this toggle, you demonstrate two things to the NASA judges:
1. You understand UI/UX and data visualization limits (avoiding "unit collision").
2. You understand the actual scientific method of analyzing climate trends (Anomaly analysis).

Good luck charting!
