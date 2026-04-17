import { useEffect, useState } from 'react';

export default function AlertsPanel({ apiBase }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${apiBase}/dashboard`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to load alerts');
      }

      if (!Array.isArray(data?.alerts)) {
        throw new Error('Alerts response is missing required fields');
      }

      setAlerts(data.alerts);
      setError('');
    } catch (err) {
      console.error('Error:', err);
      setAlerts([]);
      setError(err.message || 'Unable to load alerts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="panel"><p>Loading alerts...</p></div>;

  if (error) {
    return (
      <div className="panel">
        <div className="card">
          <div className="alert danger" style={{ marginBottom: 0 }}>
            <span className="alert-icon">!</span>
            <div className="alert-content">
              <strong>Alerts unavailable</strong>
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const highAlerts = alerts.filter((a) => a.severity === 'high');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>System Alerts and Notifications</h2>

      <div className="grid-3">
        <div className="stat-box">
          <div className="stat-label">Critical</div>
          <div className="stat-value" style={{ color: '#ff6b6b' }}>{criticalAlerts.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">High</div>
          <div className="stat-value" style={{ color: '#ffd93d' }}>{highAlerts.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Warning</div>
          <div className="stat-value" style={{ color: '#4ecdc4' }}>{warningAlerts.length}</div>
        </div>
      </div>

      {alerts.length === 0 && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No Active Alerts</h3>
            <p style={{ color: '#888', marginTop: '12px' }}>
              System is operating normally with all metrics within acceptable ranges.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
