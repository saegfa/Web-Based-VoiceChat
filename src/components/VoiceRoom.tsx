import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Users, Copy, Check } from 'lucide-react';
import { WebRTCManager } from '../lib/webrtc';
import { getRoomParticipants, leaveRoom, updateParticipantActivity } from '../lib/roomService';
import { supabase, RoomParticipant } from '../lib/supabase';

interface VoiceRoomProps {
  roomId: string;
  roomCode: string;
  onLeave: () => void;
}

export function VoiceRoom({ roomId, roomCode, onLeave }: VoiceRoomProps) {
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');

    if (!userId || !userName) {
      onLeave();
      return;
    }

    const initializeWebRTC = async () => {
      const manager = new WebRTCManager(roomId, userId);
      webrtcRef.current = manager;

      manager.onRemoteStream = (peerId: string, stream: MediaStream) => {
        let audioElement = audioElementsRef.current.get(peerId);

        if (!audioElement) {
          audioElement = new Audio();
          audioElement.autoplay = true;
          audioElementsRef.current.set(peerId, audioElement);
        }

        audioElement.srcObject = stream;
      };

      await manager.initialize();

      const currentParticipants = await getRoomParticipants(roomId);
      setParticipants(currentParticipants);
    };

    initializeWebRTC().catch(err => {
      console.error('WebRTC initialization error:', err);
      alert('Mikrofon erişimi reddedildi. Lütfen mikrofon iznini verin.');
      onLeave();
    });

    const activityInterval = setInterval(() => {
      updateParticipantActivity(roomId, userId).catch(err => {
        console.error('Failed to update activity:', err);
      });
    }, 60000);

    const channel = supabase
      .channel(`room:${roomId}:participants`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const newParticipant = payload.new as RoomParticipant;
          setParticipants(prev => [...prev, newParticipant]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const oldParticipant = payload.old as RoomParticipant;
          setParticipants(prev => prev.filter(p => p.id !== oldParticipant.id));

          if (webrtcRef.current) {
            webrtcRef.current.disconnect(oldParticipant.user_id);
          }

          const audioElement = audioElementsRef.current.get(oldParticipant.user_id);
          if (audioElement) {
            audioElement.srcObject = null;
            audioElementsRef.current.delete(oldParticipant.user_id);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(activityInterval);

      const userId = localStorage.getItem('userId');
      if (userId) {
        leaveRoom(roomId, userId);
      }

      if (webrtcRef.current) {
        webrtcRef.current.disconnect();
      }

      audioElementsRef.current.forEach(audio => {
        audio.srcObject = null;
      });
      audioElementsRef.current.clear();

      supabase.removeChannel(channel);
    };
  }, [roomId, onLeave]);

  const toggleMute = () => {
    if (webrtcRef.current) {
      const tracks = (webrtcRef.current as any).localStream?.getAudioTracks();
      if (tracks) {
        tracks.forEach((track: MediaStreamTrack) => {
          track.enabled = !track.enabled;
        });
        setIsMuted(!isMuted);
      }
    }
  };

  const handleLeave = async () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      await leaveRoom(roomId, userId);
    }

    if (webrtcRef.current) {
      webrtcRef.current.disconnect();
    }

    onLeave();
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">Sesli Sohbet</h1>

            <div className="inline-flex items-center gap-2 bg-slate-700/50 px-6 py-3 rounded-lg">
              <span className="text-slate-400 text-sm">Oda Kodu:</span>
              <span className="text-white text-2xl font-mono font-bold tracking-widest">{roomCode}</span>
              <button
                onClick={copyRoomCode}
                className="ml-2 p-2 hover:bg-slate-600/50 rounded-lg transition"
                title="Kopyala"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">
                Katılımcılar ({participants.length})
              </h2>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4 max-h-64 overflow-y-auto">
              {participants.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Henüz kimse yok</p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {participant.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{participant.user_name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-emerald-400 text-xs">Aktif</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`p-6 rounded-full shadow-lg transition transform hover:scale-110 active:scale-95 ${
                isMuted
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title={isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={handleLeave}
              className="p-6 rounded-full bg-red-500 hover:bg-red-600 shadow-lg transition transform hover:scale-110 active:scale-95"
              title="Odadan Ayrıl"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>

          <p className="text-slate-400 text-sm text-center mt-6">
            Konuşmak için mikrofonunuzun açık olduğundan emin olun
          </p>
        </div>
      </div>
    </div>
  );
}
