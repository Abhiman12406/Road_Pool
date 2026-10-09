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

// Controller to fit bounds if requested
function MapViewController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  vehicles,
  requests,
  selectedVehicleId,
  onSelectVehicle,
  onSelectRequest,
}) => {
  const puneCenter: [number, number] = [18.5204, 73.8567];

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-card border border-outline-variant/30 bg-surface-container-low">
      <MapContainer
        center={puneCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapViewController center={puneCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Vehicle Route Polylines */}
        {Object.values(vehicles).map((vehicle) => {
          if (!vehicle.route_polyline || vehicle.route_polyline.length < 2) return null;
          const isSelected = vehicle.vehicle_id === selectedVehicleId;
          return (
            <Polyline
              key={`route-${vehicle.vehicle_id}`}
              positions={vehicle.route_polyline}
              pathOptions={{
                color: isSelected ? '#00668a' : '#38bdf8',
                weight: isSelected ? 5 : 3.5,
                opacity: isSelected ? 0.95 : 0.7,
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
                    <span className="text-xs font-bold text-tertiary">PICKUP</span>
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
                    <span className="text-xs font-bold text-secondary">DROP-OFF</span>
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
      <div className="absolute bottom-4 left-4 z-[1000] bg-surface-container-lowest/90 backdrop-blur-md p-3 rounded-2xl shadow-card border border-outline-variant/30 flex flex-col gap-1.5 text-xs text-on-surface">
        <div className="font-bold text-[11px] text-on-surface-variant uppercase tracking-wider">Map Legend (Pune Core)</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary"></span>
          <span>Active Pooled Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-tertiary"></span>
          <span>Passenger Pickup</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-secondary"></span>
          <span>Passenger Drop-Off</span>
        </div>
      </div>
    </div>
  );
};
