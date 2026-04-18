import { useState, useEffect } from 'react';

export default function WarehousesPanel({ apiBase }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWh, setSelectedWh] = useState(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(`${apiBase}/warehouses`);
      const data = await res.json();
      setWarehouses(data);
      if (data.length > 0) setSelectedWh(data[0]);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <h2 style={{ marginBottom: '20px' }}>🏢 Warehouse Management</h2>
        <div className="grid-2">
          {[1, 2].map(i => (
            <div key={i} className="card" style={{ minHeight: '300px' }}>
              <div className="skeleton skeleton-line"></div>
              <div className="skeleton skeleton-line"></div>
              <div className="skeleton skeleton-line"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>🏢 Warehouse Management</h2>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>📋 Warehouse List</h3>
          {warehouses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p className="empty-state-text">No warehouses found</p>
            </div>
          ) : (
            warehouses.map(wh => (
              <div
                key={wh.id}
                onClick={() => setSelectedWh(wh)}
                className="card"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: selectedWh?.id === wh.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  background: selectedWh?.id === wh.id ? 'var(--primary-light)' : 'var(--card-bg)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <strong>{wh.name}</strong>
                    <p style={{ fontSize: '12px', margin: '4px 0', color: 'var(--text-secondary)' }}>
                      📍 ID: {wh.id}
                    </p>
                  </div>
                  <div style={{ fontSize: '24px' }}>📦</div>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedWh && (
          <div className="card">
            <h3>{selectedWh.name}</h3>
            <div style={{ marginTop: '16px' }}>
              <p><strong>ID:</strong> {selectedWh.id}</p>
              <p><strong>Location:</strong> ({selectedWh.location.lat.toFixed(4)}, {selectedWh.location.lon.toFixed(4)})</p>
              <p><strong>Capacity:</strong> {selectedWh.capacity.toLocaleString()} units</p>
              <p><strong>Operational Cost:</strong> ${selectedWh.operationalCostPerDay}/day</p>
              <p><strong>Failure Rate:</strong> {(selectedWh.failureRate * 100).toFixed(2)}%</p>

              <h4 style={{ marginTop: '20px' }}>Current Stock:</h4>
              <table className="table" style={{ marginTop: '12px' }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>% of Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedWh.currentStock).map(([productId, qty]) => (
                    <tr key={productId}>
                      <td>{productId}</td>
                      <td>{qty.toLocaleString()}</td>
                      <td>{((qty / selectedWh.capacity) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '20px' }}>
                <p><strong>Total Stock:</strong> {Object.values(selectedWh.currentStock).reduce((a, b) => a + b, 0).toLocaleString()} units</p>
                <div style={{ background: '#1a1a1a', height: '12px', borderRadius: '6px', overflow: 'hidden', marginTop: '8px' }}>
                  <div style={{
                    width: `${Math.min(100, (Object.values(selectedWh.currentStock).reduce((a, b) => a + b, 0) / selectedWh.capacity) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0066cc, #00cc99)'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warehouse Comparison */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Warehouse Comparison</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>Location</th>
              <th>Total Stock</th>
              <th>Capacity</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map(wh => {
              const totalStock = Object.values(wh.currentStock).reduce((a, b) => a + b, 0);
              return (
                <tr key={wh.id}>
                  <td><strong>{wh.name}</strong></td>
                  <td>{wh.location.lat.toFixed(2)}, {wh.location.lon.toFixed(2)}</td>
                  <td>{totalStock.toLocaleString()}</td>
                  <td>{wh.capacity.toLocaleString()}</td>
                  <td>
                    <span className="badge badge-primary">
                      {((totalStock / wh.capacity) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
