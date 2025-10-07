/*
  # Auto-cleanup for Inactive Rooms

  1. Changes
    - Add `last_activity_at` column to rooms table to track activity
    - Add `last_activity_at` column to room_participants table to track participant activity
    - Create function to automatically delete rooms inactive for 20+ minutes
    - Create scheduled job to run cleanup every 5 minutes

  2. Important Notes
    - Rooms are considered inactive if no activity for 20 minutes
    - Activity is tracked whenever participants join or update their status
    - Cleanup runs automatically via pg_cron extension
    - When a room is deleted, all participants are automatically removed (CASCADE)
*/

-- Add last_activity_at column to rooms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE rooms ADD COLUMN last_activity_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add last_activity_at column to room_participants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'room_participants' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE room_participants ADD COLUMN last_activity_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing rooms to have last_activity_at
UPDATE rooms SET last_activity_at = created_at WHERE last_activity_at IS NULL;

-- Update existing participants to have last_activity_at
UPDATE room_participants SET last_activity_at = joined_at WHERE last_activity_at IS NULL;

-- Create function to update room activity timestamp when participants join/update
CREATE OR REPLACE FUNCTION update_room_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rooms
  SET last_activity_at = now()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update room activity on participant changes
DROP TRIGGER IF EXISTS trigger_update_room_activity ON room_participants;
CREATE TRIGGER trigger_update_room_activity
  AFTER INSERT OR UPDATE ON room_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_room_activity();

-- Create function to cleanup inactive rooms
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms
  WHERE last_activity_at < (now() - interval '20 minutes')
  AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job to run every 5 minutes
SELECT cron.schedule(
  'cleanup-inactive-rooms',
  '*/5 * * * *',
  'SELECT cleanup_inactive_rooms();'
);

-- Create index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_rooms_last_activity ON rooms(last_activity_at) WHERE is_active = true;