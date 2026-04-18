import { useEffect, useRef, useState } from 'react';

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

export default function DriverRouteMap({ origin, destination, routeLabel }) {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    function clearFallbackOverlay() {
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null);
        originMarkerRef.current = null;
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
        destinationMarkerRef.current = null;
      }
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null);
        routeLineRef.current = null;
      }
    }

    function drawFallbackRoute() {
      if (!mapInstanceRef.current || !window.google?.maps) {
        return;
      }

      clearFallbackOverlay();

      const google = window.google;
      const originPoint = { lat: origin.lat, lng: origin.lon };
      const destinationPoint = { lat: destination.lat, lng: destination.lon };
      const bounds = new google.maps.LatLngBounds();

      originMarkerRef.current = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: originPoint,
        title: 'Warehouse'
      });

      destinationMarkerRef.current = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: destinationPoint,
        title: 'Customer'
      });

      routeLineRef.current = new google.maps.Polyline({
        map: mapInstanceRef.current,
        path: [originPoint, destinationPoint],
        geodesic: true,
        strokeColor: '#0066cc',
        strokeOpacity: 0.9,
        strokeWeight: 5
      });

      bounds.extend(originPoint);
      bounds.extend(destinationPoint);
      mapInstanceRef.current.fitBounds(bounds, 60);
    }

    async function renderRoute() {
      if (!origin || !destination || !mapElementRef.current) {
        return;
      }

      try {
        setError('');
        await loadGoogleMapsScript();

        if (cancelled || !window.google?.maps) {
          return;
        }

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapElementRef.current, {
            center: { lat: origin.lat, lng: origin.lon },
            zoom: 9,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true
          });
        }

        if (!directionsRendererRef.current) {
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#0066cc',
              strokeWeight: 6
            }
          });
        }

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: { lat: origin.lat, lng: origin.lon },
            destination: { lat: destination.lat, lng: destination.lon },
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: false
          },
          (result, status) => {
            if (cancelled) {
              return;
            }

            if (status === 'OK' && result) {
              clearFallbackOverlay();
              directionsRendererRef.current.setDirections(result);
            } else {
              directionsRendererRef.current.setDirections({ routes: [] });
              drawFallbackRoute();
              setError(
                `Directions API is unavailable (${status}). Showing a direct warehouse-to-customer route instead.`
              );
            }
          }
        );
      } catch (err) {
        console.error('Error rendering driver route map:', err);
        if (!cancelled) {
          if (window.google?.maps) {
            if (directionsRendererRef.current) {
              directionsRendererRef.current.setDirections({ routes: [] });
            }
            drawFallbackRoute();
            setError('Google directions are unavailable right now. Showing a direct warehouse-to-customer route.');
          } else {
            setError(err.message || 'Unable to render route on map');
          }
        }
      }
    }

    renderRoute();

    return () => {
      cancelled = true;
      clearFallbackOverlay();
    };
  }, [origin, destination]);

  return (
    <div className="card" style={{ marginTop: '16px', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 0' }}>
        <h3>{routeLabel || 'Live Delivery Route'}</h3>
        {error && <p style={{ color: '#ff6b6b', marginTop: '8px' }}>{error}</p>}
      </div>
      <div
        ref={mapElementRef}
        style={{
          width: '100%',
          height: '420px',
          minHeight: '420px',
          background: '#e9eef5',
          marginTop: '12px'
        }}
      />
    </div>
  );
}
