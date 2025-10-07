import { supabase } from './supabase';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-notification';
  from: string;
  to: string;
  data: any;
}

export class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private roomId: string;
  private userId: string;
  private channel: any;

  constructor(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
  }

  async initialize() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      const channelName = `room:${this.roomId}`;
      this.channel = supabase.channel(channelName);

      this.channel.on('broadcast', { event: 'signal' }, ({ payload }: { payload: SignalData }) => {
        this.handleSignal(payload);
      });

      await this.channel.subscribe();

      this.sendSignal({
        type: 'join-notification',
        from: this.userId,
        to: 'all',
        data: null
      });

      return this.localStream;
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  async connectToPeer(peerId: string) {
    if (this.peerConnections.has(peerId)) {
      return;
    }

    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(peerId, peerConnection);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          from: this.userId,
          to: peerId,
          data: event.candidate
        });
      }
    };

    peerConnection.ontrack = (event) => {
      this.onRemoteStream?.(peerId, event.streams[0]);
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    this.sendSignal({
      type: 'offer',
      from: this.userId,
      to: peerId,
      data: offer
    });
  }

  private async handleSignal(signal: SignalData) {
    if (signal.type === 'join-notification' && signal.from !== this.userId) {
      if (!this.peerConnections.has(signal.from)) {
        await this.connectToPeer(signal.from);
      }
      return;
    }

    if (signal.to !== this.userId) {
      return;
    }

    let peerConnection = this.peerConnections.get(signal.from);

    if (!peerConnection && signal.type === 'offer') {
      peerConnection = new RTCPeerConnection(ICE_SERVERS);
      this.peerConnections.set(signal.from, peerConnection);

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          peerConnection!.addTrack(track, this.localStream!);
        });
      }

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal({
            type: 'ice-candidate',
            from: this.userId,
            to: signal.from,
            data: event.candidate
          });
        }
      };

      peerConnection.ontrack = (event) => {
        this.onRemoteStream?.(signal.from, event.streams[0]);
      };
    }

    if (!peerConnection) return;

    try {
      if (signal.type === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        this.sendSignal({
          type: 'answer',
          from: this.userId,
          to: signal.from,
          data: answer
        });
      } else if (signal.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data));
      } else if (signal.type === 'ice-candidate') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.data));
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }

  private sendSignal(signal: SignalData) {
    this.channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: signal
    });
  }

  disconnect(peerId?: string) {
    if (peerId) {
      const pc = this.peerConnections.get(peerId);
      if (pc) {
        pc.close();
        this.peerConnections.delete(peerId);
      }
    } else {
      this.peerConnections.forEach(pc => pc.close());
      this.peerConnections.clear();

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    }
  }

  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
}
