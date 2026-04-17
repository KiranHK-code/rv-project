import { useState, useEffect } from 'react';

export default function KPIMetrics({ apiBase }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${apiBase}/dashboard`);
      const data = await res.json();
      setMetrics(data.kpis);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="panel"><p>Loading KPI metrics...</p></div>;
  if (!metrics) return <div className="panel"><p>No metrics available</p></div>;

  const getStatusColor = (status) => {
    return status === 'good' ? '#51cf66' : status === 'warning' ? '#ff6b6b' : '#ffd93d';
  };

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>📊 KPI Metrics & Performance</h2>

      {/* Main KPIs */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">📦 Delivery Time</div>
          <div style={{ padding: '24px', background: '#1a1a1a', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#0066cc', marginBottom: '12px' }}>
              {metrics.deviations.averageDeliveryTime.value}
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>days (avg)</p>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              Target: <span style={{ color: 'var(--warning-color)' }}>{metrics.deviations.averageDeliveryTime.target} days</span>
            </p>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '12px', color: '#888' }}>Status: <span style={{ color: getStatusColor(metrics.deviations.averageDeliveryTime.status) }}>{metrics.deviations.averageDeliveryTime.status.toUpperCase()}</span></p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">✅ Service Level</div>
          <div style={{ padding: '24px', background: '#1a1a1a', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: getStatusColor(metrics.deviations.serviceLevel.status), marginBottom: '12px' }}>
              {metrics.deviations.serviceLevel.value}%
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>On-time delivery</p>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              Target: <span style={{ color: 'var(--warning-color)' }}>{metrics.deviations.serviceLevel.target}%</span>
            </p>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '12px', color: '#888' }}>Status: <span style={{ color: getStatusColor(metrics.deviations.serviceLevel.status) }}>{metrics.deviations.serviceLevel.status.toUpperCase()}</span></p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">💰 Cost per Order</div>
          <div style={{ padding: '24px', background: '#1a1a1a', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4ecdc4', marginBottom: '12px' }}>
              ${metrics.deviations.averageCost.value}
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>per order</p>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              Target: <span style={{ color: 'var(--warning-color)' }}>≤${metrics.deviations.averageCost.target}</span>
            </p>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '12px', color: '#888' }}>Status: <span style={{ color: getStatusColor(metrics.deviations.averageCost.status) }}>{metrics.deviations.averageCost.status.toUpperCase()}</span></p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">🌍 CO₂ Emissions</div>
          <div style={{ padding: '24px', background: '#1a1a1a', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffd93d', marginBottom: '12px' }}>
              {metrics.deviations.co2Emissions.value}
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>kg CO₂</p>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>Total emissions</p>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '12px', color: '#888' }}>Target: Minimize</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Metrics */}
      <div className="card">
        <div className="card-title">📦 Inventory Metrics</div>
        <div className="grid-2">
          <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
            <p style={{ color: '#888', marginBottom: '8px' }}>Total Stock</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.inventory.totalStock.toLocaleString()}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', color: '#888' }}>units</p>
          </div>
          <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
            <p style={{ color: '#888', marginBottom: '8px' }}>Total Capacity</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.inventory.totalCapacity.toLocaleString()}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', color: '#888' }}>units</p>
          </div>
          <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px', gridColumn: 'span 2' }}>
            <p style={{ color: '#888', marginBottom: '12px' }}>Warehouse Utilization</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>{metrics.inventory.utilizationPercent}%</p>
            <div style={{ background: '#0a0a0a', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${metrics.inventory.utilizationPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0066cc, #00cc99)'
              }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Breakdown */}
      <div className="card">
        <div className="card-title">📊 Orders Status</div>
        <div className="grid-5">
          {Object.entries(metrics.orders.byStatus).map(([status, count]) => (
            <div key={status} style={{ textAlign: 'center', padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: getOrderStatusColor(status) }}>
                {count}
              </div>
              <div style={{ fontSize: '12px', textTransform: 'capitalize', color: '#888' }}>{status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disruptions */}
      {metrics.disruptions && metrics.disruptions.totalDisruptions > 0 && (
        <div className="card">
          <div className="card-title">⚠️ Disruption Impact</div>
          <div className="grid-2">
            <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
              <p style={{ color: '#888' }}>Total Disruptions</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>{metrics.disruptions.totalDisruptions}</p>
            </div>
            <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
              <p style={{ color: '#888' }}>Avg Recovery Time</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffd93d' }}>{metrics.disruptions.averageRecoveryTime}h</p>
            </div>
            <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
              <p style={{ color: '#888' }}>Cost Impact</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>${metrics.disruptions.totalCostImpact}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="card">
        <div className="card-title">📋 Performance Summary</div>
        <table className="table" style={{ marginTop: '16px' }}>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Current Value</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Delivery Time</td>
              <td>{metrics.deviations.averageDeliveryTime.value} days</td>
              <td>≤ {metrics.deviations.averageDeliveryTime.target} days</td>
              <td><span className={`badge badge-${metrics.deviations.averageDeliveryTime.status}`}>{metrics.deviations.averageDeliveryTime.status}</span></td>
            </tr>
            <tr>
              <td>Service Level</td>
              <td>{metrics.deviations.serviceLevel.value}%</td>
              <td>≥ {metrics.deviations.serviceLevel.target}%</td>
              <td><span className={`badge badge-${metrics.deviations.serviceLevel.status}`}>{metrics.deviations.serviceLevel.status}</span></td>
            </tr>
            <tr>
              <td>Average Cost</td>
              <td>${metrics.deviations.averageCost.value}</td>
              <td>≤ ${metrics.deviations.averageCost.target}</td>
              <td><span className={`badge badge-${metrics.deviations.averageCost.status}`}>{metrics.deviations.averageCost.status}</span></td>
            </tr>
            <tr>
              <td>Warehouse Utilization</td>
              <td>{metrics.inventory.utilizationPercent}%</td>
              <td>60-80%</td>
              <td><span className="badge badge-primary">normal</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getOrderStatusColor(status) {
  const colors = { pending: 'primary', assigned: 'info', shipped: 'primary', delivered: 'success', failed: 'danger' };
  return colors[status] || '#888';
}
