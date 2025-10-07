/*
  # Voice Chat Rooms Database Schema

  1. New Tables
    - `rooms`
      - `id` (uuid, primary key) - Unique room identifier
      - `code` (text, unique) - 6-character room code for joining
      - `name` (text) - Room name/description
      - `host_id` (text) - ID of the user who created the room
      - `is_active` (boolean) - Whether room is currently active
      - `created_at` (timestamptz) - Creation timestamp
      - `expires_at` (timestamptz) - When the room expires
    
    - `room_participants`
      - `id` (uuid, primary key) - Unique participant identifier
      - `room_id` (uuid, foreign key) - Reference to rooms table
      - `user_id` (text) - Participant identifier
      - `user_name` (text) - Display name of participant
      - `joined_at` (timestamptz) - When participant joined
      - `is_connected` (boolean) - Current connection status

  2. Security
    - Enable RLS on both tables
    - Rooms: Anyone can read active rooms, anyone can create
    - Participants: Anyone can read and join rooms
    
  3. Important Notes
    - Room codes are automatically generated 6-character alphanumeric codes
    - Rooms expire after 24 hours by default
    - Participants table tracks who is in each room
    - WebRTC signaling will use Supabase Realtime channels
*/

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  host_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Create room_participants table
CREATE TABLE IF NOT EXISTS room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  is_connected boolean DEFAULT true,
  UNIQUE(room_id, user_id)
);

-- Create index for faster room code lookups
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_participants_room ON room_participants(room_id);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms table
CREATE POLICY "Anyone can view active rooms"
  ON rooms FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON rooms FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete rooms"
  ON rooms FOR DELETE
  USING (true);

-- RLS Policies for room_participants table
CREATE POLICY "Anyone can view room participants"
  ON room_participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join rooms"
  ON room_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update participant status"
  ON room_participants FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can leave rooms"
  ON room_participants FOR DELETE
  USING (true);