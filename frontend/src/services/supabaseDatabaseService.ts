/**
 * Supabase Database & Realtime Service for Road_Pool
 * Provides real-time subscriptions, query helpers, and fallback to FastAPI REST endpoints.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { RideRequest, Vehicle } from '../types/simulation';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function fetchDatabaseStatus() {
  try {
    const res = await fetch(`${API_BASE}/database/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // API server might be starting
  }
  return {
    status: isSupabaseConfigured ? 'client_configured' : 'in_memory_mode',
    is_configured: isSupabaseConfigured,
    is_connected: isSupabaseConfigured,
    provider: 'Supabase PostgreSQL',
  };
}

export async function fetchPersistedRequests(limit = 25): Promise<RideRequest[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as unknown as RideRequest[];
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch requests directly:', err);
    }
  }

  // Graceful fallback to backend API
  try {
    const res = await fetch(`${API_BASE}/database/requests?limit=${limit}`);
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function fetchPersistedVehicles(): Promise<Vehicle[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*');

      if (!error && data) {
        return data as unknown as Vehicle[];
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch vehicles directly:', err);
    }
  }

  // Fallback to backend API
  try {
    const res = await fetch(`${API_BASE}/database/vehicles`);
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch {
    // ignore
  }
  return [];
}

export function subscribeToRequestUpdates(
  requestId: string,
  onUpdate: (payload: any) => void
): () => void {
  if (!supabase || !isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel(`request-changes-${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ride_requests',
        filter: `request_id=eq.${requestId}`,
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    if (supabase) {
      supabase.removeChannel(channel);
    }
  };
}
