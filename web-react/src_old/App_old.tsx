import { useState, useEffect } from 'react';
import { fetchMetrics, fetchTrendData } from './api/client';
import type { Metric, TrendDataResponse } from './types/api';

function App() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('T2M_MAX');
  const [data, setData] = useState<TrendDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default coordinates (Rajshahi)
  const [lat, setLat] = useState('24.37');
  const [lon, setLon] = useState('88.60');
  
  // Year ranges
  const [startYear, setStartYear] = useState('1981');
  const [endYear, setEndYear] = useState('2026');
  const [interval, setInterval] = useState('annual');
  
  // Geocoding states
  const [searchQuery, setSearchQuery] = useState('');
  const [locationName, setLocationName] = useState('Rajshahi, Bangladesh');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchMetrics().then(setMetrics).catch(console.error);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MAP_SELECT') {
        setLat(event.data.lat.toFixed(4));
        setLon(event.data.lon.toFixed(4));
        setLocationName(event.data.name);
        setSearchQuery(event.data.name);
        setShowMap(false); // Auto-close map on selection
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const results = await res.json();
      if (results.length > 0) {
        setLat(parseFloat(results[0].lat).toFixed(4));
        setLon(parseFloat(results[0].lon).toFixed(4));
        setLocationName(results[0].display_name);
      } else {
        alert("Location not found!");
      }
    } catch (e) {
      alert("Search failed. Check connection.");
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await fetchTrendData(
        parseFloat(lat), 
        parseFloat(lon), 
        selectedMetric,
        parseInt(startYear),
        parseInt(endYear),
        interval
      );
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showMap) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999 }}>
        <button 
          onClick={() => setShowMap(false)} 
          style={{ position: 'absolute', top: '15px', right: '20px', zIndex: 10000, background: '#ef4444', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Close Map
        </button>
        <iframe src="/globe.html" style={{ width: '100%', height: '100%', border: 'none' }} title="Earth Explorer" />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Hritu - Trend Detective</h1>
          <p style={{ color: '#94a3b8' }}>Investigate real NASA climate data anywhere on Earth.</p>
        </div>
        <button 
          onClick={() => setShowMap(true)}
          style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
        >
          🌍 Open 3D Globe
        </button>
      </div>

      {/* Location Search Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#cbd5e1' }}>Search City or Country</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              style={{ flex: 1 }}
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="e.g., Tokyo, Japan" 
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Find</button>
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#38bdf8' }}>📍 {locationName}</div>
        </div>
      </div>

      {/* Manual Coordinates, Metric & Years */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#cbd5e1' }}>Latitude</label>
          <input type="number" value={lat} onChange={e => setLat(e.target.value)} style={{ width: '90px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#cbd5e1' }}>Longitude</label>
          <input type="number" value={lon} onChange={e => setLon(e.target.value)} style={{ width: '90px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#cbd5e1' }}>From</label>
          <input type="number" value={startYear} onChange={e => setStartYear(e.target.value)} style={{ width: '70px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#cbd5e1' }}>To</label>
          <input type="number" value={endYear} onChange={e => setEndYear(e.target.value)} style={{ width: '70px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#cbd5e1' }}>Interval</label>
          <select value={interval} onChange={e => setInterval(e.target.value)} style={{ width: '90px' }}>
            <option value="annual">Annual</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#cbd5e1' }}>Metric</label>
          <select value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)} style={{ width: '100%' }}>
            {metrics.map(m => (
              <option key={m.id} value={m.id}>{m.label} ({m.unit})</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={handleAnalyze} disabled={loading} style={{ padding: '0.5rem 2rem' }}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '1rem', border: '1px solid #ef4444', borderRadius: '8px' }}>Error: {error}</div>}

      {data && (
        <div style={{ padding: '1.5rem', border: '1px solid #334155', borderRadius: '8px', background: '#1e293b' }}>
          
          <h2 style={{ marginTop: 0 }}>Verdict: {data.verdict.replace('_', ' ')}</h2>
          <p><strong>Metric:</strong> {data.metric_label} ({data.period})</p>
          <p><strong>Location:</strong> {locationName} <em>({data.district})</em></p>
          <p><strong>Slope:</strong> {data.slope_per_decade > 0 ? '+' : ''}{data.slope_per_decade.toFixed(3)} {data.metric_unit} / decade</p>
          <p><strong>p-value:</strong> {data.p_value.toFixed(4)}</p>

          <hr style={{ borderColor: '#334155', margin: '1.5rem 0' }} />
          
          {/* Provenance & Links */}
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
            <p style={{ margin: '0.2rem 0' }}><strong>Dataset:</strong> {data.dataset_id} <span style={{ color: '#94a3b8' }}>({data.resolution_note})</span></p>
            <p style={{ margin: '0.2rem 0' }}><strong>Data Link:</strong> <a href={data.source_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>Click here to view raw NASA JSON</a></p>
          </div>

          {/* Education Info Box */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.1)', borderLeft: '4px solid #38bdf8', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8' }}>📖 How to read this</h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.6', color: '#cbd5e1' }}>
              <li><strong>Verdict:</strong> We use the <em>Modified Mann-Kendall test</em> to see if the data is actually changing over time, or just bouncing around randomly. If it's a real trend, we say "REAL TREND".</li>
              <li><strong>p-value:</strong> This is the probability that this trend happened by pure chance. A p-value of <em>0.0020</em> means there is only a 0.2% chance this is a fluke. We only call it a REAL TREND if it is under 0.05 (5%).</li>
              <li><strong>Slope:</strong> We use the <em>Theil-Sen estimator</em> to calculate how much the metric is changing every 10 years, ignoring extreme freak weather events.</li>
            </ul>
          </div>
          
          <details style={{ marginTop: '1.5rem' }}>
            <summary style={{ cursor: 'pointer', color: '#38bdf8' }}>View API Response (for frontend dev)</summary>
            <pre style={{ background: '#0f172a', padding: '1rem', overflowX: 'auto', fontSize: '12px', marginTop: '0.5rem', border: '1px solid #334155', borderRadius: '4px' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>

        </div>
      )}
    </div>
  );
}

export default App;
