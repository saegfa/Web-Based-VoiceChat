import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Room {
  id: string;
  code: string;
  name: string;
  host_id: string;
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  joined_at: string;
  is_connected: boolean;
}
