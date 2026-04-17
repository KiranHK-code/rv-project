import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import WarehousesPanel from './components/WarehousesPanel';
import OrdersPanel from './components/OrdersPanel';
import ForecastPanel from './components/ForecastPanel';
import DisruptionPanel from './components/DisruptionPanel';
import KPIMetrics from './components/KPIMetrics';
import AlertsPanel from './components/AlertsPanel';

const API_BASE = 'http://localhost:3000/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) throw new Error('Server not responding');
      setLoading(false);
    } catch (err) {
      setError('Backend server not running. Please start: npm run dev in backend folder');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container loading">
        <div className="spinner"></div>
        <p>Connecting to backend server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container error">
        <div className="error-box">
          <h2>⚠️ Connection Error</h2>
          <p>{error}</p>
          <ol>
            <li>Open terminal in `/backend` folder</li>
            <li>Run: <code>npm install</code></li>
            <li>Run: <code>npm run dev</code></li>
            <li>Refresh this page</li>
          </ol>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'warehouses', label: '🏢 Warehouses', icon: '🏢' },
    { id: 'orders', label: '📦 Orders', icon: '📦' },
    { id: 'forecast', label: '📈 Forecast', icon: '📈' },
    { id: 'kpis', label: '📊 KPIs', icon: '📊' },
    { id: 'disruption', label: '⚠️ Disruptions', icon: '⚠️' },
    { id: 'alerts', label: '🔔 Alerts', icon: '🔔' }
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>🚚 Supply Chain Logistics & Optimization System</h1>
          <p>AI-Powered Inventory, Routing & Disruption Management</p>
        </div>
        <div className="header-status">
          <span className="status-indicator online"></span>
          <p>System Online</p>
        </div>
      </header>

      <nav className="app-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label.split(' ').pop()}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && <Dashboard apiBase={API_BASE} />}
        {activeTab === 'warehouses' && <WarehousesPanel apiBase={API_BASE} />}
        {activeTab === 'orders' && <OrdersPanel apiBase={API_BASE} />}
        {activeTab === 'forecast' && <ForecastPanel apiBase={API_BASE} />}
        {activeTab === 'kpis' && <KPIMetrics apiBase={API_BASE} />}
        {activeTab === 'disruption' && <DisruptionPanel apiBase={API_BASE} />}
        {activeTab === 'alerts' && <AlertsPanel apiBase={API_BASE} />}
      </main>

      <footer className="app-footer">
        <p>© 2024 Supply Chain Logistics System | Powered by AI & Optimization Algorithms</p>
        <p>Demand Forecasting • Inventory Optimization • Dynamic Routing • Disruption Resilience</p>
      </footer>
    </div>
  );
}

export default App;
