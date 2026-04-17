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

  if (loading) return <div className="panel"><p>Loading warehouses...</p></div>;

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>🏢 Warehouse Management</h2>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>Warehouses</h3>
          {warehouses.map(wh => (
            <div
              key={wh.id}
              onClick={() => setSelectedWh(wh)}
              style={{
                padding: '12px',
                background: selectedWh?.id === wh.id ? '#0066cc' : '#2d2d2d',
                border: '1px solid #444',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <strong>{wh.name}</strong>
              <p style={{ fontSize: '12px', margin: '4px 0', opacity: 0.8 }}>
                📍 Lat: {wh.location.lat.toFixed(2)}, Lon: {wh.location.lon.toFixed(2)}
              </p>
            </div>
          ))}
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
