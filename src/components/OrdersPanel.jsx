import { useEffect, useState } from 'react';

export default function OrdersPanel({ apiBase }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationName, setUserLocationName] = useState('');
  const [locationStatus, setLocationStatus] = useState('Fetching current location...');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
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

  const fetchUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Browser geolocation is not available on this device.');
      return;
    }

    setIsFetchingLocation(true);
    setLocationStatus('Fetching current location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };

        setUserLocation(coords);
        setUserLocationName('');
        setLocationStatus('Coordinates fetched. Looking up place name...');

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lon}&zoom=14&addressdetails=1`,
            {
              headers: {
                Accept: 'application/json'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Reverse geocoding failed');
          }

          const data = await response.json();
          const address = data.address || {};
          const placeName =
            [
              address.suburb,
              address.neighbourhood,
              address.city || address.town || address.village,
              address.state,
              address.country
            ].filter(Boolean).join(', ') ||
            data.display_name ||
            '';

          if (placeName) {
            setUserLocationName(placeName);
            setLocationStatus('Current location fetched successfully.');
          } else {
            setLocationStatus('Coordinates fetched, but place name was not available.');
          }
        } catch (error) {
          console.error('Error resolving place name:', error);
          setLocationStatus('Coordinates fetched, but place name lookup failed.');
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        const errorMessages = {
          1: 'Location permission was denied. Please allow location in the browser site settings.',
          2: 'Location could not be determined. Check whether your device location is turned on.',
          3: 'Location request timed out. Try again with Wi-Fi or device location enabled.'
        };

        setUserLocation(null);
        setUserLocationName('');
        setLocationStatus(errorMessages[error.code] || `Location error: ${error.message}`);
        setIsFetchingLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    fetchUserLocation();
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
        body: JSON.stringify({
          ...formData,
          userLocation,
          userLocationName
        })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Unable to create order');
      }
      if (res.ok) {
        setFormData(prev => ({ ...prev, quantity: 100 }));
        setMessage('Order created successfully.');
        fetchData();
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setMessage(err.message || 'Error creating order.');
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const formatLocation = (location) => {
    if (!location) return '-';
    return `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`;
  };
  const displayUserLocation = userLocationName || formatLocation(userLocation);

  if (loading) return <div className="panel"><p>Loading orders...</p></div>;

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>📦 Order Management</h2>

      {/* Create Order Form */}
      <div className="card">
        <h3>Create New Order</h3>
        <form onSubmit={handleCreateOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1.2fr 1.2fr auto', gap: '12px', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Customer</label>
            <select
              className="form-input"
              value={formData.customerId}
              onChange={(e) => {
                setFormData({ ...formData, customerId: e.target.value });
                setMessage('');
              }}
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
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Customer Location</label>
            <input
              type="text"
              className="form-input"
              value={selectedCustomer ? formatLocation(selectedCustomer.location) : ''}
              placeholder="Select a customer"
              readOnly
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Your Live Location</label>
            <input
              type="text"
              className="form-input"
              value={displayUserLocation === '-' ? '' : displayUserLocation}
              placeholder="Allow location access"
              readOnly
            />
          </div>
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '10px' }}>
          <p style={{ color: userLocation ? '#51cf66' : '#ffd93d', margin: 0 }}>{locationStatus}</p>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={fetchUserLocation}
            disabled={isFetchingLocation}
          >
            {isFetchingLocation ? 'Fetching...' : 'Retry Location'}
          </button>
        </div>
        {message && (
          <p style={{ marginTop: '12px', color: message.includes('successfully') ? '#51cf66' : '#ff6b6b' }}>
            {message}
          </p>
        )}
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
              <th>Customer Location</th>
              <th>User Location</th>
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
                <td>{formatLocation(order.customerLocation || customers.find(c => c.id === order.customerId)?.location)}</td>
                <td>{order.userLocationName || formatLocation(order.userLocation)}</td>
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
