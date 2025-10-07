import { supabase } from './supabase';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createRoom(name: string, hostId: string) {
  const code = generateRoomCode();

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      code,
      name,
      host_id: hostId,
      is_active: true
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRoomByCode(code: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function joinRoom(roomId: string, userId: string, userName: string) {
  const { data, error } = await supabase
    .from('room_participants')
    .insert({
      room_id: roomId,
      user_id: userId,
      user_name: userName,
      is_connected: true
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function leaveRoom(roomId: string, userId: string) {
  const { error } = await supabase
    .from('room_participants')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getRoomParticipants(roomId: string) {
  const { data, error } = await supabase
    .from('room_participants')
    .select('*')
    .eq('room_id', roomId)
    .eq('is_connected', true);

  if (error) throw error;
  return data || [];
}

export async function updateRoomActivity(roomId: string) {
  const { error } = await supabase
    .from('rooms')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', roomId);

  if (error) throw error;
}

export async function updateParticipantActivity(roomId: string, userId: string) {
  const { error } = await supabase
    .from('room_participants')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userId);

  if (error) throw error;
}
