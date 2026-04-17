import { useState, useEffect } from 'react';

export default function OrdersPanel({ apiBase }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerId: '',
    productId: 'PROD-001',
    quantity: 100,
    requiredDate: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0]
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        fetch(`${apiBase}/orders`),
        fetch(`${apiBase}/customers`)
      ]);
      const ordersData = await ordersRes.json();
      const customersData = await customersRes.json();
      setOrders(ordersData.orders || []);
      setCustomers(customersData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      alert('Please select a customer');
      return;
    }

    try {
      const res = await fetch(`${apiBase}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ ...formData, quantity: 100 });
        fetchData();
        alert('Order created successfully!');
      }
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div className="panel"><p>Loading orders...</p></div>;

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>📦 Order Management</h2>

      {/* Create Order Form */}
      <div className="card">
        <h3>Create New Order</h3>
        <form onSubmit={handleCreateOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Customer</label>
            <select
              className="form-input"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            >
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Product</label>
            <select className="form-input" value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })}>
              {['PROD-001', 'PROD-002', 'PROD-003', 'PROD-004', 'PROD-005'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Quantity</label>
            <input
              type="number"
              className="form-input"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              min="1"
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Required Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.requiredDate}
              onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['all', 'pending', 'assigned', 'shipped', 'delivered', 'failed'].map(s => (
          <button
            key={s}
            className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card">
        <h3>Orders ({filteredOrders.length})</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Warehouse</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td><strong>{order.id}</strong></td>
                <td>{customers.find(c => c.id === order.customerId)?.name || 'N/A'}</td>
                <td>{order.productId}</td>
                <td>{order.quantity}</td>
                <td><span className={`badge badge-${getStatusColor(order.status)}`}>{order.status}</span></td>
                <td>{order.assignedWarehouse || '-'}</td>
                <td>{order.route ? `$${order.route.cost.toFixed(2)}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getStatusColor(status) {
  const colors = { pending: 'warning', assigned: 'info', shipped: 'primary', delivered: 'success', failed: 'danger' };
  return colors[status] || 'primary';
}
