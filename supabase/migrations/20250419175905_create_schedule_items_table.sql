CREATE TABLE schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME, -- Optional
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  speaker TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- Add index for sorting/filtering
CREATE INDEX idx_schedule_items_datetime ON schedule_items (item_date, start_time);
-- Trigger for updated_at will be added in a later migration after enabling the moddatetime extension.