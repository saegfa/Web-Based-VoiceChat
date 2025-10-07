import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { getRoomByCode, joinRoom } from '../lib/roomService';

interface JoinRoomProps {
  onRoomJoined: (roomId: string, roomCode: string) => void;
}

export function JoinRoom({ onRoomJoined }: JoinRoomProps) {
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!roomCode.trim() || !userName.trim()) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);

    try {
      const room = await getRoomByCode(roomCode);

      if (!room) {
        setError('Oda bulunamadı veya aktif değil');
        return;
      }

      const userId = crypto.randomUUID();
      localStorage.setItem('userId', userId);
      localStorage.setItem('userName', userName);

      await joinRoom(room.id, userId, userName);
      onRoomJoined(room.id, room.code);
    } catch (err) {
      console.error('Odaya katılma hatası:', err);
      setError('Odaya katılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-slate-700/50 p-4 rounded-full">
              <LogIn className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Odaya Katıl
          </h1>
          <p className="text-slate-400 text-center mb-8">
            Oda kodunu girerek sohbete katılın
          </p>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-slate-300 mb-2">
                İsminiz
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="Adınızı girin"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-slate-300 mb-2">
                Oda Kodu
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-center text-2xl font-mono tracking-widest"
                placeholder="ABC123"
                maxLength={6}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Katılınıyor...' : 'Odaya Katıl'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
