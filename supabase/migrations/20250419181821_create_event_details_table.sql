CREATE TABLE event_details (
  id INT PRIMARY KEY DEFAULT 1, -- Singleton table
  event_name TEXT NOT NULL DEFAULT 'Philosothon',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  registration_deadline TIMESTAMPTZ,
  submission_deadline TIMESTAMPTZ,
  contact_email TEXT,
  -- Add other global settings as needed
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);