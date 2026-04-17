import { useEffect, useState } from 'react';

export default function Dashboard({ apiBase }) {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${apiBase}/dashboard`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to load dashboard data');
      }

      if (!data?.summary || !data?.inventory || !data?.orders || !data?.kpis) {
        throw new Error('Dashboard response is missing required fields');
      }

      setDashData(data);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDashData(null);
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>Dashboard Overview</h2>

      {error ? (
        <div className="card">
          <div className="alert danger" style={{ marginBottom: 0 }}>
            <span className="alert-icon">!</span>
            <div className="alert-content">
              <strong>Dashboard unavailable</strong>
              {error}
            </div>
          </div>
        </div>
      ) : !dashData ? (
        <p>No dashboard data available.</p>
      ) : (
        <>
          <div className="grid-4">
            <div className="stat-box">
              <div className="stat-label">Warehouses</div>
              <div className="stat-value">{dashData.summary.activeWarehouses}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Customers</div>
              <div className="stat-value">{dashData.summary.registeredCustomers}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Orders</div>
              <div className="stat-value">{dashData.summary.totalOrders}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Utilization</div>
              <div className="stat-value">{dashData.inventory.utilizationPercent}%</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Inventory Status</div>
            <div className="grid-2">
              {dashData.inventory.warehouseDetails.map((wh) => (
                <div
                  key={wh.id}
                  style={{
                    padding: '16px',
                    borderLeft: wh.lowStockAlert ? '4px solid #ff6b6b' : '4px solid #51cf66',
                    color: 'var(--text)',
                  }}
                >
                  <h4 style={{ color: 'var(--text)' }}>{wh.name}</h4>
                  <p style={{ color: 'var(--text)' }}>
                    Stock: <strong>{wh.stock.toLocaleString()}</strong> / {wh.capacity.toLocaleString()} units
                  </p>
                  <div
                    style={{
                      marginTop: '8px',
                      background: 'var(--card-bg)',
                      height: '8px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, (wh.stock / wh.capacity) * 100)}%`,
                        height: '8px',
                        background: wh.lowStockAlert ? '#ff6b6b' : '#51cf66',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text)', opacity: 0.7 }}>
                    {wh.utilization}% utilized
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Order Status Distribution</div>
            <div className="grid-4">
              {Object.entries(dashData.orders).map(([status, count]) => (
                <div
                  key={status}
                  style={{
                    textAlign: 'center',
                    padding: '16px',
                    background: 'var(--card-bg)',
                    borderRadius: '6px',
                    color: 'var(--text)',
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: getStatusColor(status) }}>{count}</div>
                  <div style={{ fontSize: '12px', marginTop: '8px', textTransform: 'capitalize', color: 'var(--text)' }}>
                    {status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Key Performance Indicators</div>
            <div className="grid-2">
              <div style={{ padding: '16px', background: 'var(--card-bg)', borderRadius: '6px', color: 'var(--text)' }}>
                <p style={{ color: 'var(--text)', opacity: 0.7, marginBottom: '8px' }}>Avg Delivery Time</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#51cf66' }}>
                  {dashData.kpis.deviations.averageDeliveryTime.value} days
                </p>
                <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text)', opacity: 0.7 }}>
                  Target: {dashData.kpis.deviations.averageDeliveryTime.target} days
                </p>
              </div>
              <div style={{ padding: '16px', background: 'var(--card-bg)', borderRadius: '6px', color: 'var(--text)' }}>
                <p style={{ color: 'var(--text)', opacity: 0.7, marginBottom: '8px' }}>Service Level</p>
                <p
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: dashData.kpis.deviations.serviceLevel.status === 'good' ? '#51cf66' : '#ff6b6b',
                  }}
                >
                  {dashData.kpis.deviations.serviceLevel.value}%
                </p>
                <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text)', opacity: 0.7 }}>
                  Target: {dashData.kpis.deviations.serviceLevel.target}%
                </p>
              </div>
              <div style={{ padding: '16px', background: 'var(--card-bg)', borderRadius: '6px', color: 'var(--text)' }}>
                <p style={{ color: 'var(--text)', opacity: 0.7, marginBottom: '8px' }}>Cost per Order</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ecdc4' }}>${dashData.allocation.totalCost}</p>
                <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text)', opacity: 0.7 }}>
                  Orders: {dashData.orders.assigned}
                </p>
              </div>
              <div style={{ padding: '16px', background: 'var(--card-bg)', borderRadius: '6px', color: 'var(--text)' }}>
                <p style={{ color: 'var(--text)', opacity: 0.7, marginBottom: '8px' }}>CO2 Emissions</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffd93d' }}>{dashData.allocation.totalCO2} kg</p>
                <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text)', opacity: 0.7 }}>Total</p>
              </div>
            </div>
          </div>

          {dashData.disruptions.totalDisruptions > 0 && (
            <div className="card">
              <div className="card-title">Disruptions</div>
              <p>Total Disruptions: <strong>{dashData.disruptions.totalDisruptions}</strong></p>
              <p>Average Recovery Time: <strong>{dashData.disruptions.averageRecoveryTime} hours</strong></p>
            </div>
          )}

          {dashData.alerts && dashData.alerts.length > 0 && (
            <div className="card">
              <div className="card-title">Active Alerts</div>
              {dashData.alerts.slice(0, 5).map((alert, idx) => (
                <div key={idx} className={`alert ${alert.severity}`}>
                  <span className="alert-icon">
                    {alert.severity === 'critical' ? 'red' : alert.severity === 'high' ? 'orange' : 'yellow'}
                  </span>
                  <div className="alert-content">
                    <strong>{alert.type}</strong>
                    {alert.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getStatusColor(status) {
  const colors = {
    pending: '#ffd93d',
    assigned: '#4ecdc4',
    shipped: '#0066cc',
    delivered: '#51cf66',
    failed: '#ff6b6b',
  };
  return colors[status] || '#888';
}
