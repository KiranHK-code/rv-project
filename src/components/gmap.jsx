import { useEffect, useMemo, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBS7XTc0VO9OQezSt6c6sHUDIRANBfuZf0';
const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-js-sdk';

function loadGoogleMapsScript() {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(window.google.maps), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps loaded, but maps API is unavailable'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}

export default function GMap({ apiBase }) {
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedType, setSelectedType] = useState('warehouse');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);
        setError('');

        const [warehouseRes, customerRes, orderRes] = await Promise.all([
          fetch(`${apiBase}/warehouses`),
          fetch(`${apiBase}/customers`),
          fetch(`${apiBase}/orders`)
        ]);

        if (!warehouseRes.ok || !customerRes.ok || !orderRes.ok) {
          throw new Error('Unable to load map data');
        }

        const warehouseData = await warehouseRes.json();
        const customerData = await customerRes.json();
        const orderData = await orderRes.json();

        setWarehouses(warehouseData);
        setCustomers(customerData);
        setOrders(orderData.orders || []);

        if (warehouseData.length > 0) {
          setSelectedType('warehouse');
          setSelectedId(warehouseData[0].id);
        }
      } catch (err) {
        console.error('Error loading map data:', err);
        setError(err.message || 'Unable to load map data');
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [apiBase]);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMapsScript()
      .then(() => {
        if (!cancelled) {
          setMapReady(true);
        }
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err);
        if (!cancelled) {
          setError(err.message || 'Unable to load Google Maps');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const orderLocations = useMemo(() => {
    return orders
      .filter((order) => order.userLocation || order.customerLocation)
      .map((order) => ({
        id: order.id,
        name: order.userLocationName || `Order ${order.id}`,
        subtitle: `${order.productId} | Qty ${order.quantity}`,
        location: order.userLocation || order.customerLocation
      }));
  }, [orders]);

  const selectedOptions = useMemo(() => {
    if (selectedType === 'warehouse') {
      return warehouses.map((warehouse) => ({
        id: warehouse.id,
        name: warehouse.name,
        subtitle: `Capacity ${warehouse.capacity}`,
        location: warehouse.location
      }));
    }

    if (selectedType === 'customer') {
      return customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        subtitle: customer.region,
        location: customer.location
      }));
    }

    return orderLocations;
  }, [selectedType, warehouses, customers, orderLocations]);

  useEffect(() => {
    if (selectedOptions.length === 0) {
      setSelectedId('');
      return;
    }

    const hasSelection = selectedOptions.some((item) => item.id === selectedId);
    if (!hasSelection) {
      setSelectedId(selectedOptions[0].id);
    }
  }, [selectedOptions, selectedId]);

  const selectedLocation = selectedOptions.find((item) => item.id === selectedId) || null;

  useEffect(() => {
    if (!mapReady || !mapElementRef.current || !window.google?.maps) {
      return;
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (selectedType === 'warehouse' && warehouses.length > 0) {
      // Show all warehouse markers
      const bounds = new window.google.maps.LatLngBounds();
      
      warehouses.forEach((warehouse) => {
        const position = {
          lat: warehouse.location.lat,
          lng: warehouse.location.lon
        };

        const marker = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: warehouse.name,
          label: warehouse.name.charAt(0).toUpperCase()
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="padding: 8px;">
            <strong>${warehouse.name}</strong><br/>
            Capacity: ${warehouse.capacity}<br/>
            Stock: ${Object.values(warehouse.currentStock).reduce((a, b) => a + b, 0)}
          </div>`
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
      });

      if (!mapInstanceRef.current) {
        const center = {
          lat: warehouses[0].location.lat,
          lng: warehouses[0].location.lon
        };
        mapInstanceRef.current = new window.google.maps.Map(mapElementRef.current, {
          center,
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        });
      }

      mapInstanceRef.current.fitBounds(bounds);
    } else if (selectedLocation?.location) {
      // Show single marker for other types
      const center = {
        lat: selectedLocation.location.lat,
        lng: selectedLocation.location.lon
      };

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapElementRef.current, {
          center,
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        });
      } else {
        mapInstanceRef.current.setCenter(center);
        mapInstanceRef.current.setZoom(12);
      }

      const marker = new window.google.maps.Marker({
        position: center,
        map: mapInstanceRef.current,
        title: selectedLocation.name
      });

      markersRef.current.push(marker);
    }
  }, [mapReady, selectedLocation, selectedType, warehouses]);

  if (loading) {
    return (
      <div className="panel">
        <p>Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <div className="card">
          <div className="alert danger" style={{ marginBottom: 0 }}>
            <span className="alert-icon">!</span>
            <div className="alert-content">
              <strong>Map unavailable</strong>
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>Google Map View</h2>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '12px', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">View Type</label>
            <select className="form-input" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="warehouse">Warehouses</option>
              <option value="customer">Customers</option>
              <option value="order">Orders</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Location</label>
            <select className="form-input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {selectedOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedLocation ? (
        <>
          <div className="card">
            <div className="grid-2">
              <div>
                <div className="card-title">{selectedLocation.name}</div>
                <p>{selectedLocation.subtitle || 'Location details'}</p>
                <p style={{ marginTop: '8px' }}>
                  Coordinates: {selectedLocation.location.lat.toFixed(4)}, {selectedLocation.location.lon.toFixed(4)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <a
                  className="btn btn-primary"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedLocation.location.lat},${selectedLocation.location.lon}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              ref={mapElementRef}
              style={{
                width: '100%',
                height: '520px',
                minHeight: '520px',
                background: '#e9eef5'
              }}
            />
          </div>
        </>
      ) : (
        <div className="card">
          <p>No map location available.</p>
        </div>
      )}
    </div>
  );
}
