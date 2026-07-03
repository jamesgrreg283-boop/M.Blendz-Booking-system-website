-- Services catalog (replaces hardcoded services)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  duration INTEGER NOT NULL,
  description TEXT,
  category TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  barber_ids TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer profiles (stats derived from bookings)
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  favourite_barber TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers (phone);

-- Allow no_show status on bookings
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- Exclude no_show from unique slot constraint (same as cancelled)
DROP INDEX IF EXISTS bookings_barber_date_time_unique;
CREATE UNIQUE INDEX IF NOT EXISTS bookings_barber_date_time_unique
  ON bookings (barber, date, time)
  WHERE status NOT IN ('cancelled', 'no_show');

-- Seed default services
INSERT INTO services (id, name, price, duration, description, category, active, barber_ids, sort_order)
VALUES
  ('haircut-18', 'Haircut (18+)', 25, 45, 'Classic cut for adults 18 and over.', 'Main Services', true, ARRAY['m-blendz'], 1),
  ('haircut-beard', 'Haircut & Beard', 30, 50, 'Haircut with beard trim and shape.', 'Main Services', true, ARRAY['m-blendz'], 2),
  ('shape-up', 'Shape Up', 15, 20, 'Line-up and shape around the edges.', 'Additional Services', true, ARRAY['m-blendz'], 3),
  ('haircut-under-18', 'Haircut (under 18s)', 20, 40, 'Haircut for under 18s.', 'Other', true, ARRAY['m-blendz'], 4)
ON CONFLICT (id) DO NOTHING;
