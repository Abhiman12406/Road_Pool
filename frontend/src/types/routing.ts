export interface PuneLandmark {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  description: string;
}

export interface LocationInput {
  lat: number;
  lng: number;
  name: string;
}

export interface FareBreakdown {
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  total_solo_fare: number;
  currency: string;
  currency_symbol: string;
}

export interface DirectRouteResponse {
  origin: LocationInput;
  destination: LocationInput;
  distance_km: number;
  duration_sec: number;
  duration_min: number;
  polyline: [number, number][]; // [lat, lng] coordinates for Leaflet
  solo_fare_inr: number;
  fare_breakdown: FareBreakdown;
  provider: 'osrm' | 'pune_calibrated_fallback';
  cached: boolean;
  estimated_pooled_fare_inr: number;
  estimated_pooled_savings_inr: number;
  max_detour_cap_pct: number;
  max_detour_buffer_min: number;
}

export interface DirectRouteRequest {
  origin: LocationInput;
  destination: LocationInput;
  party_size: number;
}
