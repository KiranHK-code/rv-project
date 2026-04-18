import { useEffect, useState } from 'react';

export default function KPIMetrics({ apiBase }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${apiBase}/dashboard`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to load KPI metrics');
      }

      if (!data?.kpis?.deviations || !data?.kpis?.inventory || !data?.kpis?.orders) {
        throw new Error('KPI response is missing required fields');
      }

      setMetrics(data.kpis);
      setError('');
    } catch (err) {
      console.error('Error:', err);
      setMetrics(null);
      setError(err.message || 'Unable to load KPI metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <h2 style={{ marginBottom: '20px' }}>📊 KPI Metrics and Performance</h2>
        <div className="grid-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card" style={{ minHeight: '200px' }}>
              <div className="skeleton skeleton-line" style={{ marginBottom: '12px' }}></div>
              <div className="skeleton skeleton-line" style={{ marginBottom: '12px', width: '80%' }}></div>
              <div className="skeleton skeleton-line"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <h2 style={{ marginBottom: '20px' }}>📊 KPI Metrics and Performance</h2>
        <div className="card">
          <div className="alert danger" style={{ marginBottom: 0 }}>
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <strong>KPI metrics unavailable</strong>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return <div className="panel"><p>No metrics available</p></div>;

  const getStatusColor = (status) => {
    return status === 'good' ? '#51cf66' : status === 'warning' ? '#ff6b6b' : '#ffd93d';
  };

  return (
    <div className="panel">📊 
      <h2 style={{ marginBottom: '20px' }}>KPI Metrics and Performance</h2>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Delivery Time</div>
          <div style={{ padding: '24px', background: '#1a1a1a', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#0066cc', marginBottom: '12px' }}>
              {metrics.deviations.averageDeliveryTime.value}
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>days (avg)</p>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              Target: <span style={{ color: 'var(--warning-color)' }}>{metrics.deviations.averageDeliveryTime.target} days</span>
            </p>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '12px', color: '#888' }}>
                Status:{' '}
                <span style={{ color: getStatusColor(metrics.deviations.averageDeliveryTime.status) }}>
                  {metrics.deviations.averageDeliveryTime.status.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Service Level</div>
          <div style={{ padding: '24px', background: '#1a1a1a', borderRadius: '6px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: getStatusColor(metrics.deviations.serviceLevel.status),
                marginBottom: '12px',
              }}
            >
              {metrics.deviations.serviceLevel.value}%
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>On-time delivery</p>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              Target: <span style={{ color: 'var(--warning-color)' }}>{metrics.deviations.serviceLevel.target}%</span>
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Cost per Order</div>
          <div style={{ padding: '24px', background: '#1a1a1a', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4ecdc4', marginBottom: '12px' }}>
              ${metrics.deviations.averageCost.value}
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>per order</p>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              Target: <span style={{ color: 'var(--warning-color)' }}>${metrics.deviations.averageCost.target}</span>
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-title">CO2 Emissions</div>
          <div style={{ padding: '24px', background: '#1a1a1a', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffd93d', marginBottom: '12px' }}>
              {metrics.deviations.co2Emissions.value}
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>kg CO2</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Inventory Metrics</div>
        <div className="grid-2">
          <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
            <p style={{ color: '#888', marginBottom: '8px' }}>Total Stock</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.inventory.totalStock.toLocaleString()}</p>
          </div>
          <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
            <p style={{ color: '#888', marginBottom: '8px' }}>Total Capacity</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.inventory.totalCapacity.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
