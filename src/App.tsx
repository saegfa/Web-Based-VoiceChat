import { useState } from 'react';
import { Home } from './components/Home';
import { CreateRoom } from './components/CreateRoom';
import { JoinRoom } from './components/JoinRoom';
import { VoiceRoom } from './components/VoiceRoom';

type View = 'home' | 'create' | 'join' | 'room';

function App() {
  const [view, setView] = useState<View>('home');
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [currentRoomCode, setCurrentRoomCode] = useState<string>('');

  const handleRoomCreated = (roomId: string, roomCode: string) => {
    setCurrentRoomId(roomId);
    setCurrentRoomCode(roomCode);
    setView('room');
  };

  const handleRoomJoined = (roomId: string, roomCode: string) => {
    setCurrentRoomId(roomId);
    setCurrentRoomCode(roomCode);
    setView('room');
  };

  const handleLeaveRoom = () => {
    setCurrentRoomId('');
    setCurrentRoomCode('');
    setView('home');
  };

  return (
    <>
      {view === 'home' && (
        <Home
          onCreateRoom={() => setView('create')}
          onJoinRoom={() => setView('join')}
        />
      )}
      {view === 'create' && <CreateRoom onRoomCreated={handleRoomCreated} />}
      {view === 'join' && <JoinRoom onRoomJoined={handleRoomJoined} />}
      {view === 'room' && (
        <VoiceRoom
          roomId={currentRoomId}
          roomCode={currentRoomCode}
          onLeave={handleLeaveRoom}
        />
      )}
    </>
  );
}

export default App;
