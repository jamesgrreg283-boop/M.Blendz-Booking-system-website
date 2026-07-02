-- Coventry Barber Studio: bookings table
-- Run this migration when connecting Supabase

CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  service TEXT NOT NULL,
  barber TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent double bookings for same barber/date/time (excluding cancelled)
CREATE UNIQUE INDEX IF NOT EXISTS bookings_barber_date_time_unique
  ON bookings (barber, date, time)
  WHERE status != 'cancelled';

-- Index for admin queries
CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (date);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

-- RLS policies (enable when auth is added)
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- For MVP without auth, allow public insert and select
-- CREATE POLICY "Allow public insert" ON bookings FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public select" ON bookings FOR SELECT USING (true);
-- CREATE POLICY "Allow public update" ON bookings FOR UPDATE USING (true);
