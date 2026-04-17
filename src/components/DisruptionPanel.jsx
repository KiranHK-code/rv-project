import { useState } from 'react';

export default function DisruptionPanel({ apiBase }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disruptionType, setDisruptionType] = useState('warehouse_failure');

  const simulateDisruption = async (type) => {
    setLoading(true);
    try {
      const endpoints = {
        warehouse_failure: '/disruption/simulate/warehouse-failure?warehouseId=WH-NYC',
        shipment_delay: '/disruption/simulate/shipment-delay?orderId=ORD-001&delayHours=24',
        blocked_route: '/disruption/simulate/blocked-route?orderId=ORD-001&reason=Weather',
        random: '/disruption/simulate/random'
      };

      const res = await fetch(`${apiBase}${endpoints[type]}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>⚠️ Disruption Simulation</h2>

      <div className="card">
        <h3>Simulate Supply Chain Disruptions</h3>
        <p style={{ marginBottom: '20px', color: '#888' }}>Test system resilience by simulating real-world disruptions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <button
            className={`btn ${disruptionType === 'warehouse_failure' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setDisruptionType('warehouse_failure');
              simulateDisruption('warehouse_failure');
            }}
          >
            🏢 Warehouse Failure
          </button>
          <button
            className={`btn ${disruptionType === 'shipment_delay' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setDisruptionType('shipment_delay');
              simulateDisruption('shipment_delay');
            }}
          >
            📦 Shipment Delay
          </button>
          <button
            className={`btn ${disruptionType === 'blocked_route' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setDisruptionType('blocked_route');
              simulateDisruption('blocked_route');
            }}
          >
            🛣️ Blocked Route
          </button>
          <button
            className="btn btn-danger"
            onClick={() => simulateDisruption('random')}
          >
            🎲 Random Disruption
          </button>
        </div>
      </div>

      {loading && <div className="card"><p>Simulating disruption...</p></div>}

      {result && !result.error && (
        <>
          <div className="card">
            <h3>Disruption Details</h3>
            <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px', marginBottom: '16px' }}>
              <p><strong>Type:</strong> {result.disruption?.disruptionType || result.disruptionType}</p>
              <p><strong>Time:</strong> {result.disruption?.timestamp || result.timestamp}</p>
              {result.disruption?.affectedWarehouse && (
                <p><strong>Affected:</strong> {result.disruption.affectedWarehouse.name}</p>
              )}
              {result.affectedOrders !== undefined && (
                <p><strong>Orders Affected:</strong> {result.affectedOrders}</p>
              )}
            </div>

            {result.resilienceStrategy && (
              <div>
                <h4>Resilience Strategy</h4>
                {result.resilienceStrategy.strategies.map((strategy, idx) => (
                  <div key={idx} style={{ padding: '12px', background: '#1a1a1a', marginBottom: '12px', borderLeft: '4px solid #0066cc', borderRadius: '4px' }}>
                    <p><strong>Priority {strategy.priority}:</strong> {strategy.name}</p>
                    <p style={{ fontSize: '13px', color: '#ccc', margin: '8px 0' }}>{strategy.description}</p>
                    <p style={{ fontSize: '12px', color: '#888' }}>
                      Cost: <span style={{ color: strategy.cost.includes('Low') ? '#51cf66' : '#ff6b6b' }}>{strategy.cost}</span> | 
                      Time: {strategy.timeToImplement}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {result.recommendations && (
              <div style={{ marginTop: '20px' }}>
                <h4>Recommendations</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ padding: '8px', background: '#1a1a1a', marginBottom: '8px', borderLeft: '4px solid #00cc99',paddingLeft: '12px' }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result.alternativeRoutes && (
            <div className="card">
              <h3>Alternative Routes</h3>
              {result.alternativeRoutes.map((route, idx) => (
                <div key={idx} style={{ padding: '12px', background: '#1a1a1a', marginBottom: '12px', borderRadius: '6px' }}>
                  <p><strong>Option {route.option}</strong></p>
                  {route.suggestion ? (
                    <p>{route.suggestion}</p>
                  ) : (
                    <>
                      <p>Distance: {route.distance} | Time: {route.time} | Cost: {route.cost}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="card">
        <h3>Resilience Metrics</h3>
        <p style={{ color: '#888', marginBottom: '16px' }}>System capability to handle disruptions</p>
        <div className="grid-2">
          <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
            <p style={{ color: '#888' }}>Warehouses</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#51cf66' }}>5</p>
            <p style={{ fontSize: '12px', marginTop: '8px', color: '#888' }}>Geographic redundancy</p>
          </div>
          <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
            <p style={{ color: '#888' }}>Recovery Time</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffd93d' }}>2-4h</p>
            <p style={{ fontSize: '12px', marginTop: '8px', color: '#888' }}>Average</p>
          </div>
        </div>
      </div>
    </div>
  );
}
