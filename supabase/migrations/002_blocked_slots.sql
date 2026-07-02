-- Blocked slots table (run when connecting Supabase)

CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber TEXT NOT NULL DEFAULT '*',
  date DATE NOT NULL,
  end_date DATE,
  time TEXT,
  end_time TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS blocked_slots_date_idx ON blocked_slots (date);

-- Add optional columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'online';
