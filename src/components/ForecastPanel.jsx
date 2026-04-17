import { useState, useEffect } from 'react';

export default function ForecastPanel({ apiBase }) {
  const [customers, setCustomers] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [method, setMethod] = useState('movingAverage');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${apiBase}/customers`);
      const data = await res.json();
      setCustomers(data);
      if (data.length > 0) setSelectedCustomer(data[0].id);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateForecast = async () => {
    try {
      const res = await fetch(`${apiBase}/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer,
          method,
          days: 30
        })
      });
      const data = await res.json();
      setForecast(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>📈 Demand Forecasting</h2>

      <div className="card">
        <h3>Forecast Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Customer</label>
            <select
              className="form-input"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Method</label>
            <select className="form-input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="movingAverage">Moving Average</option>
              <option value="linear">Linear Regression</option>
              <option value="seasonal">Seasonal</option>
              <option value="ensemble">Ensemble</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={generateForecast}>
              Generate Forecast
            </button>
          </div>
        </div>
      </div>

      {forecast && (
        <>
          <div className="card">
            <h3>Historical Data & Forecast</h3>
            <div className="grid-2">
              {Object.entries(forecast.forecast).map(([productId, forecastData]) => (
                <div key={productId} style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
                  <h4>{productId}</h4>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>30-day forecast using {forecast.method}</p>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '150px' }}>
                    {forecastData.slice(0, 15).map((val, idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          height: `${(val / Math.max(...forecastData.slice(0, 15))) * 100}%`,
                          background: 'linear-gradient(180deg, #0066cc, #004499)',
                          borderRadius: '2px 2px 0 0'
                        }}
                        title={`Day ${idx + 1}: ${val} units`}
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', marginTop: '12px' }}>
                    <strong>Avg:</strong> {(forecastData.reduce((a, b) => a + b, 0) / forecastData.length).toFixed(0)} units/day
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Forecast Details</h3>
            <pre style={{ background: '#1a1a1a', padding: '12px', borderRadius: '6px', overflow: 'auto', fontSize: '12px' }}>
              {JSON.stringify(forecast, null, 2)}
            </pre>
          </div>
        </>
      )}

      <div className="card">
        <h3>Forecasting Methods</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: '8px', marginBottom: '8px', borderLeft: '4px solid #0066cc', paddingLeft: '12px' }}>
            <strong>Moving Average</strong> - Simple trend based on last N periods
          </li>
          <li style={{ padding: '8px', marginBottom: '8px', borderLeft: '4px solid #00cc99', paddingLeft: '12px' }}>
            <strong>Linear Regression</strong> - Captures linear trends in data
          </li>
          <li style={{ padding: '8px', marginBottom: '8px', borderLeft: '4px solid #ffd93d', paddingLeft: '12px' }}>
            <strong>Seasonal</strong> - Based on weekly/monthly patterns
          </li>
          <li style={{ padding: '8px', borderLeft: '4px solid #ff6b6b', paddingLeft: '12px' }}>
            <strong>Ensemble</strong> - Weighted average of multiple methods
          </li>
        </ul>
      </div>
    </div>
  );
}
