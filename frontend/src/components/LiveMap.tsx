import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Vehicle, RideRequest } from '../types/simulation';

interface LiveMapProps {
  vehicles: Record<string, Vehicle>;
  requests: Record<string, RideRequest>;
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  onSelectRequest: (id: string) => void;
  soloRoutePolyline?: [number, number][] | null;
  soloPickupLocation?: { lat: number; lng: number; name: string } | null;
  soloDropoffLocation?: { lat: number; lng: number; name: string } | null;
  focusedVehiclePolyline?: [number, number][] | null;
  routeVisualState?: 'proposed' | 'confirmed' | 'completed';
  mapId?: string;
}

// Custom vehicle icon creator
function createVehicleIcon(vehicle: Vehicle, isSelected: boolean) {
  const isEnRoute = vehicle.status === 'en_route';
  const colorClass = isSelected 
    ? 'bg-primary-container text-on-primary-container ring-4 ring-primary-container/40' 
    : isEnRoute 
      ? 'bg-primary text-on-primary' 
      : 'bg-surface-container-high text-on-surface';

  const html = `
    <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-300">
      <div class="w-10 h-10 rounded-full shadow-lg ${colorClass} flex flex-col items-center justify-center border-2 border-white">
        <span class="material-symbols-outlined text-[18px]">directions_car</span>
      </div>
      <div class="absolute -top-6 bg-surface-container-lowest/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[10px] font-bold text-on-surface shadow-sm border border-outline-variant/30 flex items-center gap-1">
        <span>${vehicle.vehicle_id}</span>
        <span class="text-tertiary">⚡${vehicle.battery_pct}%</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-vehicle-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function createStopIcon(type: 'pickup' | 'dropoff', _label: string) {
  const isPickup = type === 'pickup';
  const color = isPickup ? 'bg-tertiary text-on-tertiary' : 'bg-secondary text-on-secondary';
  const icon = isPickup ? 'pin_drop' : 'flag';

  const html = `
    <div class="flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
      <div class="w-7 h-7 rounded-full shadow-md ${color} flex items-center justify-center border border-white">
        <span class="material-symbols-outlined text-[15px]">${icon}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-stop-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createSoloMarkerIcon(type: 'pickup' | 'dropoff', label: string) {
  const isPickup = type === 'pickup';
  const bgClass = isPickup ? 'bg-[#00668a] text-white ring-4 ring-[#00668a]/30' : 'bg-[#eec200] text-[#231b00] ring-4 ring-[#eec200]/40';
  const icon = isPickup ? 'my_location' : 'flag_circle';

  const html = `
    <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
      <div class="w-8 h-8 rounded-full shadow-xl ${bgClass} flex items-center justify-center border-2 border-white animate-bounce-short">
        <span class="material-symbols-outlined text-[18px]">${icon}</span>
      </div>
      <div class="absolute -bottom-6 bg-surface-container-lowest/95 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-on-surface shadow-md border border-outline-variant/40 whitespace-nowrap">
        ${isPickup ? 'PICKUP: ' : 'DEST: '}${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-solo-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface MapLifecycleControllerProps {
  polyline?: [number, number][] | null;
  vehicles?: Record<string, Vehicle>;
  selectedVehicleId?: string | null;
  recenterTrigger?: number;
}

// Robust lifecycle controller: handles ResizeObserver, staggered invalidateSize, and role-aware bounds
function MapLifecycleController({
  polyline,
  vehicles,
  selectedVehicleId,
  recenterTrigger = 0,
}: MapLifecycleControllerProps) {
  const map = useMap();

  const fitAppropriateBounds = React.useCallback(() => {
    try {
      // 1. If explicit route polyline provided (Passenger solo route or focused trip)
      if (polyline && polyline.length >= 2) {
        const bounds = L.latLngBounds(polyline);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        return;
      }

      // 2. If a specific driver vehicle is selected
      if (selectedVehicleId && vehicles && vehicles[selectedVehicleId]) {
        const veh = vehicles[selectedVehicleId];
        if (veh.route_polyline && veh.route_polyline.length >= 2) {
          const bounds = L.latLngBounds(veh.route_polyline);
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        } else {
          map.setView([veh.current_location.lat, veh.current_location.lng], 14);
        }
        return;
      }

      // 3. If multiple fleet vehicles exist (Operations console view)
      if (vehicles && Object.keys(vehicles).length > 0) {
        const coords: [number, number][] = Object.values(vehicles).map((v) => [
          v.current_location.lat,
          v.current_location.lng,
        ]);
        if (coords.length === 1) {
          map.setView(coords[0], 14);
        } else if (coords.length > 1) {
          const bounds = L.latLngBounds(coords);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
        return;
      }

      // 4. Default: Pune center
      map.setView([18.5204, 73.8567], 13);
    } catch (e) {
      console.warn('Leaflet fitBounds error:', e);
    }
  }, [map, polyline, vehicles, selectedVehicleId]);

  // Handle ResizeObserver on container + staggered invalidateSize
  useEffect(() => {
    const triggerInvalidate = () => {
      map.invalidateSize();
    };

    // Staggered invalidations for immediate, post-CSS layout, and post-animation rendering
    triggerInvalidate();
    const t1 = setTimeout(triggerInvalidate, 150);
    const t2 = setTimeout(() => {
      triggerInvalidate();
      fitAppropriateBounds();
    }, 400);

    const container = map.getContainer();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [map, fitAppropriateBounds]);

  // Recenter whenever recenterTrigger fires
  useEffect(() => {
    if (recenterTrigger > 0) {
      map.invalidateSize();
      fitAppropriateBounds();
    }
  }, [recenterTrigger, map, fitAppropriateBounds]);

  // Fit bounds whenever polyline updates
  useEffect(() => {
    if (polyline && polyline.length >= 2) {
      fitAppropriateBounds();
    }
  }, [polyline, fitAppropriateBounds]);

  return null;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  vehicles,
  requests,
  selectedVehicleId,
  onSelectVehicle,
  onSelectRequest,
  soloRoutePolyline,
  soloPickupLocation,
  soloDropoffLocation,
  focusedVehiclePolyline,
  routeVisualState,
  mapId,
}) => {
  const puneCenter: [number, number] = [18.5204, 73.8567];
  const activeBoundsPolyline = focusedVehiclePolyline || soloRoutePolyline;
  const [recenterCount, setRecenterCount] = React.useState<number>(0);

  const handleRecenter = () => {
    setRecenterCount((prev) => prev + 1);
  };

  const getRouteStateColors = () => {
    switch (routeVisualState) {
      case 'completed':
        return { casing: '#10b981', core: '#059669', dash: undefined };
      case 'proposed':
        return { casing: '#fed01b', core: '#735c00', dash: '8, 8' };
      case 'confirmed':
      default:
        return { casing: '#38bdf8', core: '#00668a', dash: undefined };
    }
  };

  const stateColors = getRouteStateColors();

  return (
    <div className="isolate relative z-0 w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-card border border-[#efefef] bg-[#f8f8f8]">
      {/* Floating Recenter & Invalidate Button */}
      <button
        type="button"
        id="btn-map-recenter"
        onClick={handleRecenter}
        title="Recenter and refresh map view"
        className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-black shadow-md border border-[#e2e2e2] flex items-center gap-1.5 text-xs font-medium transition-all active:scale-95 hover:shadow-lg backdrop-blur-sm"
      >
        <span className="material-symbols-outlined text-[16px]">my_location</span>
        <span>Recenter</span>
      </button>

      <MapContainer
        key={mapId || 'live-map'}
        center={puneCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapLifecycleController
          polyline={activeBoundsPolyline}
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          recenterTrigger={recenterCount}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Focused Active Trip Route Polylines if provided */}
        {focusedVehiclePolyline && focusedVehiclePolyline.length >= 2 && (
          <>
            <Polyline
              key="focused-casing"
              positions={focusedVehiclePolyline}
              pathOptions={{
                color: stateColors.casing,
                weight: 9,
                opacity: 0.4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              key="focused-core"
              positions={focusedVehiclePolyline}
              pathOptions={{
                color: stateColors.core,
                weight: 5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: stateColors.dash,
              }}
            />
          </>
        )}

        {/* Solo Reference Direct Route (Clean Blue Polyline) */}
        {soloRoutePolyline && soloRoutePolyline.length >= 2 && (
          <>
            {/* Outer soft blue casing for high visibility */}
            <Polyline
              key="solo-route-casing"
              positions={soloRoutePolyline}
              pathOptions={{
                color: '#38bdf8',
                weight: 8,
                opacity: 0.45,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Core crisp blue route polyline */}
            <Polyline
              key="solo-route-core"
              positions={soloRoutePolyline}
              pathOptions={{
                color: '#00668a',
                weight: 4.5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        )}

        {/* Dedicated Solo Pickup Marker */}
        {soloPickupLocation && (
          <Marker
            position={[soloPickupLocation.lat, soloPickupLocation.lng]}
            icon={createSoloMarkerIcon('pickup', soloPickupLocation.name)}
          >
            <Popup>
              <div className="p-1.5 min-w-[160px]">
                <div className="text-[10px] font-extrabold text-primary uppercase tracking-wider">Direct Solo Pickup</div>
                <div className="font-bold text-sm text-on-surface mt-0.5">{soloPickupLocation.name}</div>
                <div className="text-xs text-on-surface-variant mt-1">Coordinates: {soloPickupLocation.lat.toFixed(4)}, {soloPickupLocation.lng.toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dedicated Solo Dropoff Marker */}
        {soloDropoffLocation && (
          <Marker
            position={[soloDropoffLocation.lat, soloDropoffLocation.lng]}
            icon={createSoloMarkerIcon('dropoff', soloDropoffLocation.name)}
          >
            <Popup>
              <div className="p-1.5 min-w-[160px]">
                <div className="text-[10px] font-extrabold text-secondary uppercase tracking-wider">Direct Solo Destination</div>
                <div className="font-bold text-sm text-on-surface mt-0.5">{soloDropoffLocation.name}</div>
                <div className="text-xs text-on-surface-variant mt-1">Coordinates: {soloDropoffLocation.lat.toFixed(4)}, {soloDropoffLocation.lng.toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Fleet Vehicle Route Polylines */}
        {Object.values(vehicles).map((vehicle) => {
          if (!vehicle.route_polyline || vehicle.route_polyline.length < 2) return null;
          const isSelected = vehicle.vehicle_id === selectedVehicleId;
          return (
            <Polyline
              key={`route-${vehicle.vehicle_id}`}
              positions={vehicle.route_polyline}
              pathOptions={{
                color: isSelected ? '#4d661c' : '#735c00',
                weight: isSelected ? 4.5 : 2.5,
                opacity: isSelected ? 0.9 : 0.45,
                dashArray: vehicle.status === 'idle' ? '6, 8' : undefined,
              }}
            />
          );
        })}

        {/* Vehicle Markers */}
        {Object.values(vehicles).map((vehicle) => {
          const isSelected = vehicle.vehicle_id === selectedVehicleId;
          return (
            <Marker
              key={vehicle.vehicle_id}
              position={[vehicle.current_location.lat, vehicle.current_location.lng]}
              icon={createVehicleIcon(vehicle, isSelected)}
              eventHandlers={{
                click: () => onSelectVehicle(vehicle.vehicle_id),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="font-bold text-sm text-on-surface">{vehicle.name}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">{vehicle.current_location.name}</div>
                  <div className="mt-2 flex items-center justify-between text-xs border-t pt-1.5 border-outline-variant/30">
                    <span>Seats: <strong>{vehicle.occupied_seats}/{vehicle.capacity}</strong></span>
                    <span className="text-tertiary font-bold">{vehicle.status.toUpperCase()}</span>
                  </div>
                  {vehicle.planned_stops.length > 0 && (
                    <div className="mt-2 text-[11px] bg-surface-container p-1.5 rounded">
                      <div className="font-semibold text-primary">Next Stop:</div>
                      <div>{vehicle.planned_stops[0].passenger_name} ({vehicle.planned_stops[0].stop_type})</div>
                      <div className="text-on-surface-variant">ETA in ~{Math.round(vehicle.planned_stops[0].eta_seconds_from_now / 60)} mins</div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Stops Markers for active requests */}
        {Object.values(requests).map((req) => {
          if (req.status === 'dropped_off' || req.status === 'rejected') return null;
          return (
            <React.Fragment key={req.request_id}>
              <Marker
                position={[req.pickup.lat, req.pickup.lng]}
                icon={createStopIcon('pickup', req.passenger_name)}
                eventHandlers={{ click: () => onSelectRequest(req.request_id) }}
              >
                <Popup>
                  <div className="p-1">
                    <span className="text-xs font-bold text-tertiary">FLEET PICKUP</span>
                    <div className="font-semibold text-sm">{req.passenger_name}</div>
                    <div className="text-xs text-on-surface-variant">{req.pickup.name}</div>
                  </div>
                </Popup>
              </Marker>
              <Marker
                position={[req.dropoff.lat, req.dropoff.lng]}
                icon={createStopIcon('dropoff', req.passenger_name)}
                eventHandlers={{ click: () => onSelectRequest(req.request_id) }}
              >
                <Popup>
                  <div className="p-1">
                    <span className="text-xs font-bold text-secondary">FLEET DROP-OFF</span>
                    <div className="font-semibold text-sm">{req.passenger_name}</div>
                    <div className="text-xs text-on-surface-variant">{req.dropoff.name}</div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-card border border-[#efefef] flex flex-col gap-1.5 text-xs text-black">
        <div className="font-bold text-[10px] text-[#5e5e5e] uppercase tracking-wider">Map Legend (Pune Core)</div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1 bg-[#00668a] rounded-full shadow-sm"></span>
          <span className="font-medium text-black">Solo Direct Route (Clean Blue)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00668a]"></span>
          <span className="text-[#5e5e5e]">Solo Pickup Landmark</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#eec200]"></span>
          <span className="text-[#5e5e5e]">Solo Destination Landmark</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
          <span className="text-[#5e5e5e]">Active Fleet Vehicle</span>
        </div>
      </div>
    </div>
  );
};
