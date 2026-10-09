import type { PuneLandmark, DirectRouteResponse, LocationInput } from '../types/routing';

const API_BASE = 'http://localhost:8000/api/v1';

export const FALLBACK_PUNE_LANDMARKS: PuneLandmark[] = [
  {
    id: 'shivajinagar',
    name: 'Shivajinagar Hub',
    category: 'Transit Hub',
    lat: 18.5314,
    lng: 73.8446,
    description: 'Central multimodal hub, metro interchange and bus terminus',
  },
  {
    id: 'swargate',
    name: 'Swargate Junction',
    category: 'Transit Hub',
    lat: 18.5018,
    lng: 73.8636,
    description: 'Major southern transportation node & PMPML headquarters',
  },
  {
    id: 'kothrud',
    name: 'Kothrud Stand',
    category: 'Residential & Commercial',
    lat: 18.5074,
    lng: 73.8077,
    description: 'Western corridor arterial center and Metro line terminal',
  },
  {
    id: 'hinjewadi',
    name: 'Hinjewadi IT Park Phase 1',
    category: 'Tech Park',
    lat: 18.5913,
    lng: 73.7389,
    description: 'Rajiv Gandhi Infotech Park Phase 1, major tech workforce hub',
  },
  {
    id: 'viman_nagar',
    name: 'Viman Nagar Town Centre',
    category: 'Commercial & Airport',
    lat: 18.5679,
    lng: 73.9143,
    description: 'Eastern urban hub, Phoenix Marketcity & airport approach',
  },
  {
    id: 'baner',
    name: 'Baner Road',
    category: 'High Street',
    lat: 18.5590,
    lng: 73.7868,
    description: 'Western commercial artery connecting Aundh, Balewadi & NH48',
  },
  {
    id: 'pune_station',
    name: 'Pune Railway Station',
    category: 'Transit Hub',
    lat: 18.5289,
    lng: 73.8744,
    description: 'Central railway junction and intercity rail gateway',
  },
  {
    id: 'magarpatta',
    name: 'Magarpatta Cybercity',
    category: 'Tech Park',
    lat: 18.5135,
    lng: 73.9318,
    description: 'Eastern integrated township, IT cybercity and residential hub',
  },
  {
    id: 'deccan',
    name: 'Deccan Gymkhana',
    category: 'Commercial & Cultural',
    lat: 18.5167,
    lng: 73.8415,
    description: 'Historic central commercial square along Mutha River',
  },
  {
    id: 'aundh',
    name: 'Aundh Parihar Chowk',
    category: 'Residential & Retail',
    lat: 18.5580,
    lng: 73.8075,
    description: 'Premier residential neighborhood and western retail strip',
  },
  {
    id: 'airport',
    name: 'Pune International Airport',
    category: 'Airport',
    lat: 18.5822,
    lng: 73.9197,
    description: 'Lohegaon Pune International Airport Terminal',
  },
  {
    id: 'hadapsar',
    name: 'Hadapsar Gadital',
    category: 'Transit Hub',
    lat: 18.4967,
    lng: 73.9284,
    description: 'Southeastern transit intersection and Solapur highway link',
  },
];

export async function fetchPuneLandmarks(): Promise<PuneLandmark[]> {
  try {
    const res = await fetch(`${API_BASE}/routing/landmarks`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch landmarks from backend, using calibrated Pune catalog:', err);
  }
  return FALLBACK_PUNE_LANDMARKS;
}

export async function fetchDirectRoute(
  origin: LocationInput,
  destination: LocationInput,
  partySize: number = 1,
  forceFallback: boolean = false
): Promise<DirectRouteResponse> {
  const url = `${API_BASE}/routing/direct-route${forceFallback ? '?force_fallback=true' : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destination,
      party_size: partySize,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Routing service failed with status ${res.status}`);
  }

  return res.json();
}

export async function submitPassengerRideRequest(payload: {
  pickup_name: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_name: string;
  dropoff_lat: number;
  dropoff_lng: number;
  party_size: number;
  solo_distance_km: number;
  solo_eta_sec: number;
  solo_fare_inr: number;
  passenger_name?: string;
  preferred_pickup_time?: string;
  arrival_deadline?: string;
  special_requirements?: string;
}) {
  const res = await fetch(`${API_BASE}/simulation/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Booking request failed with status ${res.status}`);
  }

  return res.json();
}
