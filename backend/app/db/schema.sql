-- ==============================================================================
-- Road_Pool / RidePool AI - Supabase Production Schema & Migrations
-- Algorithmic Transit Ride-Pooling, Dynamic Batching & Fair Fare Allocation Engine
-- Pune, Maharashtra, India
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Profiles Table (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('passenger', 'driver', 'dispatcher')) DEFAULT 'passenger',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Vehicles Fleet Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    vehicle_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    occupied_seats INT NOT NULL DEFAULT 0,
    current_lat DOUBLE PRECISION NOT NULL,
    current_lng DOUBLE PRECISION NOT NULL,
    current_location_name TEXT NOT NULL DEFAULT 'Pune Hub',
    status TEXT NOT NULL CHECK (status IN ('idle', 'en_route', 'full')) DEFAULT 'idle',
    heading_deg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    battery_pct INT NOT NULL DEFAULT 90,
    route_polyline JSONB NOT NULL DEFAULT '[]'::jsonb,
    planned_stops JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Ride Requests Table
CREATE TABLE IF NOT EXISTS public.ride_requests (
    request_id TEXT PRIMARY KEY,
    passenger_id TEXT NOT NULL,
    passenger_name TEXT NOT NULL DEFAULT 'Elena Vance',
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lng DOUBLE PRECISION NOT NULL,
    pickup_name TEXT NOT NULL,
    dropoff_lat DOUBLE PRECISION NOT NULL,
    dropoff_lng DOUBLE PRECISION NOT NULL,
    dropoff_name TEXT NOT NULL,
    party_size INT NOT NULL DEFAULT 1 CHECK (party_size >= 1 AND party_size <= 4),
    request_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    solo_eta_sec INT NOT NULL DEFAULT 600,
    solo_distance_km DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    solo_fare_inr DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    status TEXT NOT NULL CHECK (status IN ('waiting_batch', 'matched', 'en_route_pickup', 'in_transit', 'dropped_off', 'rejected', 'solo_dispatched')) DEFAULT 'waiting_batch',
    assigned_vehicle_id TEXT REFERENCES public.vehicles(vehicle_id) ON DELETE SET NULL,
    batch_id INT,
    pooled_eta_sec INT,
    detour_pct DOUBLE PRECISION,
    shapley_fare_inr DOUBLE PRECISION,
    rejection_reason TEXT,
    preferred_pickup_time TEXT,
    arrival_deadline TEXT,
    special_requirements TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Sliding-Window Dispatch Batches Table
CREATE TABLE IF NOT EXISTS public.batches (
    window_id INT PRIMARY KEY,
    window_interval_sec INT NOT NULL DEFAULT 45,
    batch_threshold INT NOT NULL DEFAULT 6,
    status TEXT NOT NULL CHECK (status IN ('intake_open', 'locked_optimizing', 'dispatched')) DEFAULT 'intake_open',
    queued_request_count INT NOT NULL DEFAULT 0,
    queued_seats_count INT NOT NULL DEFAULT 0,
    trigger_reason TEXT,
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Detour Audits (≤ 15% Strict Detour Cap Proofs) Table
CREATE TABLE IF NOT EXISTS public.detour_audits (
    id BIGSERIAL PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES public.ride_requests(request_id) ON DELETE CASCADE,
    passenger_id TEXT NOT NULL,
    passenger_name TEXT NOT NULL,
    vehicle_id TEXT,
    pickup_name TEXT NOT NULL,
    dropoff_name TEXT NOT NULL,
    solo_eta_sec INT NOT NULL,
    solo_distance_km DOUBLE PRECISION NOT NULL,
    pooled_eta_sec INT,
    pooled_distance_km DOUBLE PRECISION,
    actual_detour_pct DOUBLE PRECISION,
    max_allowable_detour_pct DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    is_compliant BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL,
    violation_reason TEXT,
    mathematical_proof TEXT NOT NULL,
    delay_margin_sec INT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Shapley Fair-Fare Allocation Pools Table
CREATE TABLE IF NOT EXISTS public.shapley_pools (
    pool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id TEXT NOT NULL,
    batch_id INT,
    request_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    grand_coalition_cost_inr DOUBLE PRECISION NOT NULL,
    total_savings_inr DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    player_allocations JSONB NOT NULL DEFAULT '{}'::jsonb,
    coalition_matrix JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Mid-Trip Dynamic Joining & Consent Audit Table
CREATE TABLE IF NOT EXISTS public.mid_trip_joins (
    id BIGSERIAL PRIMARY KEY,
    request_id TEXT NOT NULL,
    passenger_name TEXT NOT NULL,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(vehicle_id) ON DELETE CASCADE,
    pickup_name TEXT NOT NULL,
    dropoff_name TEXT NOT NULL,
    party_size INT NOT NULL DEFAULT 1,
    proposed_fare_inr DOUBLE PRECISION NOT NULL,
    detour_pct DOUBLE PRECISION NOT NULL,
    driver_consent TEXT NOT NULL DEFAULT 'pending',
    passenger_consent TEXT NOT NULL DEFAULT 'pending',
    status TEXT NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES for Ultra-Fast Geospatial & Batch Queries
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_batch_id ON public.ride_requests(batch_id);
CREATE INDEX IF NOT EXISTS idx_requests_vehicle_id ON public.ride_requests(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_detour_audits_request_id ON public.detour_audits(request_id);
CREATE INDEX IF NOT EXISTS idx_shapley_pools_vehicle_id ON public.shapley_pools(vehicle_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detour_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shapley_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mid_trip_joins ENABLE ROW LEVEL SECURITY;

-- Read policies: public/anon can read public data for live interactive maps and stats
CREATE POLICY "Public read vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Public read requests" ON public.ride_requests FOR SELECT USING (true);
CREATE POLICY "Public read batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Public read detour_audits" ON public.detour_audits FOR SELECT USING (true);
CREATE POLICY "Public read shapley_pools" ON public.shapley_pools FOR SELECT USING (true);
CREATE POLICY "Public read mid_trip_joins" ON public.mid_trip_joins FOR SELECT USING (true);
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

-- Insert/Update policies: public and authenticated can insert requests and trigger simulations
CREATE POLICY "Allow insert ride_requests" ON public.ride_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update ride_requests" ON public.ride_requests FOR UPDATE USING (true);
CREATE POLICY "Allow write vehicles" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "Allow write batches" ON public.batches FOR ALL USING (true);
CREATE POLICY "Allow write detour_audits" ON public.detour_audits FOR ALL USING (true);
CREATE POLICY "Allow write shapley_pools" ON public.shapley_pools FOR ALL USING (true);
CREATE POLICY "Allow write mid_trip_joins" ON public.mid_trip_joins FOR ALL USING (true);
CREATE POLICY "Allow user manage profile" ON public.profiles FOR ALL USING (true);

-- Seed initial Pune vehicles so fresh projects start with a live fleet
INSERT INTO public.vehicles (vehicle_id, name, capacity, occupied_seats, current_lat, current_lng, current_location_name, status, heading_deg, battery_pct)
VALUES 
    ('VEH-PUNE-01', 'ORoute Fleet EV-1', 4, 0, 18.5204, 73.8567, 'Shivajinagar Hub', 'idle', 45.0, 92),
    ('VEH-PUNE-02', 'ORoute Fleet EV-2', 4, 0, 18.5018, 73.8636, 'Swargate Junction', 'idle', 180.0, 88),
    ('VEH-PUNE-03', 'ORoute Fleet EV-3', 4, 0, 18.5913, 73.7389, 'Hinjewadi Tech Park Phase 1', 'idle', 90.0, 95)
ON CONFLICT (vehicle_id) DO NOTHING;
