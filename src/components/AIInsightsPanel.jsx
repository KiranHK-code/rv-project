import { useState, useEffect } from 'react';
import { PRODUCTS } from '../constants/products';

export default function AIInsightsPanel({ apiBase }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [insights, setInsights] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [supplyChainInsights, setSupplyChainInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('forecast');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const parseApiResponse = async (res, fallbackMessage) => {
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || fallbackMessage);
    }

    return data;
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${apiBase}/customers`);
      const data = await res.json();
      setCustomers(data);
      if (data.length > 0) setSelectedCustomer(data[0].id || '');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const generateForecastInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/ai/forecast-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer,
          productId: selectedProduct
        })
      });
      const data = await parseApiResponse(res, 'Unable to generate forecast insights');
      setInsights(data.data);
    } catch (err) {
      console.error('Error:', err);
      setInsights({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const detectAnomalies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/ai/detect-anomalies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer,
          productId: selectedProduct
        })
      });
      const data = await parseApiResponse(res, 'Unable to detect anomalies');
      setAnomalies(data.data);
    } catch (err) {
      console.error('Error:', err);
      setAnomalies({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getSupplyChainInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/ai/supply-chain-insights`);
      const data = await parseApiResponse(res, 'Unable to analyze the supply chain');
      setSupplyChainInsights(data.data);
    } catch (err) {
      console.error('Error:', err);
      setSupplyChainInsights({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>🤖 AI-Powered Supply Chain Insights (Gemini)</h2>

      {/* Tab Navigation */}
      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          📈 Demand Insights
        </button>
        <button
          className={`tab-button ${activeTab === 'anomalies' ? 'active' : ''}`}
          onClick={() => setActiveTab('anomalies')}
        >
          🚨 Anomalies
        </button>
        <button
          className={`tab-button ${activeTab === 'supply-chain' ? 'active' : ''}`}
          onClick={() => setActiveTab('supply-chain')}
        >
          🏭 Supply Chain
        </button>
      </div>

      {/* Forecast Insights Tab */}
      {activeTab === 'forecast' && (
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3>Forecast Insights</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
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
                <label className="form-label">Product</label>
                <select
                  className="form-input"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  {PRODUCTS.map((product) => (
                    <option key={product} value={product}>{product}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={generateForecastInsights}
                disabled={loading}
                style={{ padding: '8px 16px' }}
              >
                {loading ? '⏳ Analyzing...' : '✨ Get Insights'}
              </button>
            </div>
          </div>

          {insights && (
            <div className="card">
              <h3>📊 AI Analysis Results</h3>
              {insights.error ? (
                <div style={{ padding: '12px', background: '#fee', borderRadius: '4px', color: '#c00' }}>
                  Error: {insights.error}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {insights.trend && (
                    <div style={{ padding: '12px', background: '#f0f8ff', borderRadius: '4px', borderLeft: '4px solid #0066cc' }}>
                      <strong>📈 Trend:</strong> {insights.trend}
                    </div>
                  )}
                  {insights.recommendations && Array.isArray(insights.recommendations) && (
                    <div>
                      <strong>💡 Recommendations:</strong>
                      <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                        {insights.recommendations.map((rec, idx) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insights.confidence && (
                    <div style={{ padding: '12px', background: '#f0fff0', borderRadius: '4px', borderLeft: '4px solid #51cf66' }}>
                      <strong>✅ Confidence:</strong> {insights.confidence}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3>Anomaly Detection</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
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
                <label className="form-label">Product</label>
                <select
                  className="form-input"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  {PRODUCTS.map((product) => (
                    <option key={product} value={product}>{product}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={detectAnomalies}
                disabled={loading}
                style={{ padding: '8px 16px' }}
              >
                {loading ? '⏳ Scanning...' : '🔍 Detect'}
              </button>
            </div>
          </div>

          {anomalies && (
            <div className="card">
              <h3>🚨 Anomaly Detection Results</h3>
              {anomalies.error ? (
                <div style={{ padding: '12px', background: '#fee', borderRadius: '4px', color: '#c00' }}>
                  Error: {anomalies.error}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {anomalies.anomalies && anomalies.anomalies.length > 0 ? (
                    <div>
                      <strong>⚠️ Detected Anomalies:</strong>
                      {anomalies.anomalies.map((anom, idx) => (
                        <div key={idx} style={{ padding: '12px', background: '#fff3cd', borderRadius: '4px', marginTop: '8px' }}>
                          {anom}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '12px', background: '#d4edda', borderRadius: '4px' }}>
                      ✅ No anomalies detected - demand pattern is normal
                    </div>
                  )}
                  {anomalies.severity && (
                    <div style={{ padding: '12px', background: '#e7f3ff', borderRadius: '4px', borderLeft: '4px solid #ff9800' }}>
                      <strong>Severity Level:</strong> {anomalies.severity}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Supply Chain Insights Tab */}
      {activeTab === 'supply-chain' && (
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <button
              className="btn btn-primary"
              onClick={getSupplyChainInsights}
              disabled={loading}
              style={{ padding: '8px 16px', width: '200px' }}
            >
              {loading ? '⏳ Analyzing System...' : '🏭 Analyze Full System'}
            </button>
          </div>

          {supplyChainInsights && (
            <div className="card">
              <h3>🏭 Supply Chain Analysis</h3>
              {supplyChainInsights.error ? (
                <div style={{ padding: '12px', background: '#fee', borderRadius: '4px', color: '#c00' }}>
                  Error: {supplyChainInsights.error}
                </div>
              ) : (
                <div>
                  {supplyChainInsights.report && (
                    <div style={{ 
                      padding: '16px', 
                      background: '#f9f9f9', 
                      borderRadius: '6px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>
                      {supplyChainInsights.report}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '12px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px', textAlign: 'center' }}>
        <p>🤖 Powered by Google Gemini AI | Real-time supply chain analytics</p>
      </div>
    </div>
  );
}
