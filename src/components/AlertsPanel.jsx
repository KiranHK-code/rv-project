import { useState, useEffect } from 'react';

export default function AlertsPanel({ apiBase }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${apiBase}/dashboard`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="panel"><p>Loading alerts...</p></div>;

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>🔔 System Alerts & Notifications</h2>

      {/* Alert Summary */}
      <div className="grid-3">
        <div className="stat-box">
          <div className="stat-label">🔴 Critical</div>
          <div className="stat-value" style={{ color: '#ff6b6b' }}>{criticalAlerts.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">🟠 High</div>
          <div className="stat-value" style={{ color: '#ffd93d' }}>{highAlerts.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">🟡 Warning</div>
          <div className="stat-value" style={{ color: '#4ecdc4' }}>{warningAlerts.length}</div>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ color: '#ff6b6b' }}>🔴 Critical Alerts</div>
          {criticalAlerts.map(alert => (
            <div key={alert.id} className="alert danger" style={{ marginBottom: '12px' }}>
              <span className="alert-icon">⚠️</span>
              <div className="alert-content" style={{ flex: 1 }}>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
                {alert.action && <p style={{ fontSize: '12px', marginTop: '8px', color: '#ffaaaa' }}>🔧 Action: {alert.action}</p>}
              </div>
              <div style={{ fontSize: '12px', color: '#888', minWidth: '100px', textAlign: 'right' }}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* High Priority Alerts */}
      {highAlerts.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ color: '#ffd93d' }}>🟠 High Priority Alerts</div>
          {highAlerts.map(alert => (
            <div key={alert.id} className="alert warning" style={{ marginBottom: '12px' }}>
              <span className="alert-icon">⚡</span>
              <div className="alert-content" style={{ flex: 1 }}>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
                {alert.action && <p style={{ fontSize: '12px', marginTop: '8px', color: '#ffffaa' }}>🔧 Action: {alert.action}</p>}
              </div>
              <div style={{ fontSize: '12px', color: '#888', minWidth: '100px', textAlign: 'right' }}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ color: '#4ecdc4' }}>🟡 Warnings</div>
          {warningAlerts.map(alert => (
            <div key={alert.id} className="alert info" style={{ marginBottom: '12px' }}>
              <span className="alert-icon">ℹ️</span>
              <div className="alert-content" style={{ flex: 1 }}>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
                {alert.action && <p style={{ fontSize: '12px', marginTop: '8px', color: '#aaffff' }}>🔧 Action: {alert.action}</p>}
              </div>
              <div style={{ fontSize: '12px', color: '#888', minWidth: '100px', textAlign: 'right' }}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length === 0 && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>✅</p>
            <h3>No Active Alerts</h3>
            <p style={{ color: '#888', marginTop: '12px' }}>System is operating normally with all metrics within acceptable ranges</p>
          </div>
        </div>
      )}

      {/* Alert Categories */}
      <div className="card">
        <div className="card-title">📋 Alert Categories</div>
        <div className="grid-2">
          <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px', borderLeft: '4px solid #ff6b6b' }}>
            <h4>Stock Levels</h4>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Triggered when warehouse stock falls below minimum threshold</p>
          </div>
          <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px', borderLeft: '4px solid #ffd93d' }}>
            <h4>Order Backlog</h4>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Triggered when too many orders are pending allocation</p>
          </div>
          <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px', borderLeft: '4px solid #0066cc' }}>
            <h4>Service Level</h4>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Triggered when on-time delivery rate drops below target</p>
          </div>
          <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px', borderLeft: '4px solid #4ecdc4' }}>
            <h4>Capacity</h4>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Triggered when warehouse capacity exceeds safe levels</p>
          </div>
        </div>
      </div>

      {/* Alert Rules */}
      <div className="card">
        <div className="card-title">⚙️ Alert Thresholds</div>
        <table className="table">
          <thead>
            <tr>
              <th>Alert Type</th>
              <th>Threshold</th>
              <th>Severity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Low Stock Warning</td>
              <td>&lt; 20% of capacity</td>
              <td><span className="badge badge-warning">High</span></td>
              <td>Plan reorder</td>
            </tr>
            <tr>
              <td>Critical Stock</td>
              <td>&lt; 15% of capacity</td>
              <td><span className="badge badge-danger">Critical</span></td>
              <td>Immediate reorder</td>
            </tr>
            <tr>
              <td>Order Backlog</td>
              <td>&gt; 25 pending orders</td>
              <td><span className="badge badge-warning">High</span></td>
              <td>Run allocation</td>
            </tr>
            <tr>
              <td>Service Level</td>
              <td>&lt; 90% on-time</td>
              <td><span className="badge badge-warning">High</span></td>
              <td>Review routing</td>
            </tr>
            <tr>
              <td>Capacity Exceeded</td>
              <td>&gt; 95% utilized</td>
              <td><span className="badge badge-warning">High</span></td>
              <td>Redistribute stock</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
