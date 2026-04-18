import { useEffect, useState } from 'react';

export default function DisruptionPanel({ apiBase }) {
  const [orders, setOrders] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    disruptionType: 'shipment_delay',
    orderId: '',
    delayHours: 24,
    reason: 'Traffic congestion'
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${apiBase}/orders`);
      const data = await res.json();
      const availableOrders = (data.orders || []).filter((order) => order.assignedWarehouse || order.route);
      setOrders(availableOrders);
      if (availableOrders.length > 0) {
        setForm((prev) => ({ ...prev, orderId: availableOrders[0].id }));
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Unable to load orders for disruption analysis');
    }
  };

  const runDisruption = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const endpoint =
        form.disruptionType === 'blocked_route'
          ? '/disruption/simulate/blocked-route'
          : '/disruption/simulate/shipment-delay';

      const payload =
        form.disruptionType === 'blocked_route'
          ? {
              orderId: form.orderId,
              reason: form.reason,
              delayHours: Number(form.delayHours)
            }
          : {
              orderId: form.orderId,
              delayHours: Number(form.delayHours),
              reason: form.reason
            };

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to analyze disruption');
      }

      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Unable to analyze disruption');
    } finally {
      setLoading(false);
    }
  };

  const selectedOrder = orders.find((order) => order.id === form.orderId);

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>Disruption Intelligence</h2>

      <div className="card">
        <h3>Analyze Delivery Delay or Route Issue</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 140px 1fr auto',
            gap: '12px',
            alignItems: 'end'
          }}
        >
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Scenario</label>
            <select
              className="form-input"
              value={form.disruptionType}
              onChange={(e) => setForm({ ...form, disruptionType: e.target.value })}
            >
              <option value="shipment_delay">Shipment Delay</option>
              <option value="blocked_route">Blocked Route</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Order</label>
            <select
              className="form-input"
              value={form.orderId}
              onChange={(e) => setForm({ ...form, orderId: e.target.value })}
            >
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id} - {order.productId}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Delay (hrs)</label>
            <input
              type="number"
              className="form-input"
              min="1"
              value={form.delayHours}
              onChange={(e) => setForm({ ...form, delayHours: Number.parseInt(e.target.value, 10) || 1 })}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Cause Hint</label>
            <input
              type="text"
              className="form-input"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Traffic, weather, accident..."
            />
          </div>

          <button className="btn btn-primary" onClick={runDisruption} disabled={loading || !form.orderId}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {selectedOrder && (
          <p style={{ marginTop: '12px', color: '#888' }}>
            Current order: {selectedOrder.id} | Product: {selectedOrder.productId} | Warehouse:{' '}
            {selectedOrder.assignedWarehouse || 'Not assigned yet'}
          </p>
        )}
      </div>

      {error && (
        <div className="card">
          <div className="alert danger" style={{ marginBottom: 0 }}>
            <span className="alert-icon">!</span>
            <div className="alert-content">
              <strong>Disruption analysis unavailable</strong>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && !error && (
        <>
          <div className="card">
            <h3>Disruption Details</h3>
            <div className="grid-2">
              <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
                <p><strong>Type:</strong> {result.disruption?.disruptionType}</p>
                <p><strong>Order:</strong> {result.disruption?.affectedOrder}</p>
                <p><strong>Expected Delivery:</strong> {result.analysis?.expectedDeliveryDate || '-'}</p>
                <p><strong>Cause:</strong> {result.analysis?.cause?.category || '-'}</p>
                <p style={{ color: '#888' }}>{result.analysis?.cause?.description}</p>
              </div>
              <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
                <p><strong>AI Risk Level:</strong> {result.analysis?.predictiveAnalysis?.riskLevel || '-'}</p>
                <p><strong>Stock Severity:</strong> {result.analysis?.stockRisk?.severity || '-'}</p>
                <p><strong>Days of Cover:</strong> {result.analysis?.stockRisk?.daysOfCover ?? 'N/A'}</p>
                <p style={{ color: '#888' }}>{result.analysis?.predictiveAnalysis?.summary}</p>
              </div>
            </div>
          </div>

          {result.analysis?.recommendedRoute && (
            <div className="card">
              <h3>Best Route Recommendation</h3>
              <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '6px' }}>
                <p><strong>{result.analysis.recommendedRoute.label}</strong></p>
                <p>
                  Distance: {result.analysis.recommendedRoute.distance} km | Time:{' '}
                  {result.analysis.recommendedRoute.deliveryHours} hrs | Cost: $
                  {result.analysis.recommendedRoute.cost}
                </p>
                <p>Resilience: {result.analysis.recommendedRoute.resilience}</p>
                <p style={{ color: '#888' }}>{result.analysis.recommendedRoute.reason}</p>
              </div>
            </div>
          )}

          {result.alternativeRoutes?.length > 0 && (
            <div className="card">
              <h3>Alternative Routes</h3>
              {result.alternativeRoutes.map((route) => (
                <div
                  key={route.id}
                  style={{
                    padding: '12px',
                    background: '#1a1a1a',
                    marginBottom: '12px',
                    borderRadius: '6px',
                    borderLeft: route.id === result.analysis?.recommendedRoute?.id ? '4px solid #51cf66' : '4px solid #0066cc'
                  }}
                >
                  <p><strong>{route.label}</strong></p>
                  <p>
                    {route.distance} km | {route.deliveryHours} hrs | ${route.cost}
                  </p>
                  <p style={{ color: '#888' }}>{route.reason}</p>
                </div>
              ))}
            </div>
          )}

          {result.analysis?.stockRisk && (
            <div className="card">
              <h3>Stock Risk Prediction</h3>
              <div className="grid-4">
                <div className="stat-box">
                  <div className="stat-label">Current Stock</div>
                  <div className="stat-value">{result.analysis.stockRisk.currentStock}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Avg Daily Demand</div>
                  <div className="stat-value">{result.analysis.stockRisk.avgDailyDemand}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">3-Day Demand</div>
                  <div className="stat-value">{result.analysis.stockRisk.projectedDemand3Days}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">After Delay</div>
                  <div className="stat-value">{result.analysis.stockRisk.projectedStockAfterDelay}</div>
                </div>
              </div>
              {result.analysis.stockRisk.stockoutBeforeRecovery && (
                <div className="alert danger" style={{ marginTop: '16px' }}>
                  <span className="alert-icon">!</span>
                  <div className="alert-content">
                    <strong>Stockout risk before delivery recovery</strong>
                    <p>The current stock may run out before the delayed shipment stabilizes.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {(result.analysis?.predictiveAnalysis?.actions?.length > 0 || result.recommendations?.length > 0) && (
            <div className="card">
              <h3>Recommended Actions</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[...(result.analysis?.predictiveAnalysis?.actions || []), ...(result.recommendations || [])].map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    style={{ padding: '8px', marginBottom: '8px', borderLeft: '4px solid #00cc99', paddingLeft: '12px' }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.analysis?.aiPrediction && (
            <div className="card">
              <h3>AI Prediction</h3>
              <pre
                style={{
                  background: '#1a1a1a',
                  padding: '12px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}
              >
                {JSON.stringify(result.analysis.aiPrediction, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
