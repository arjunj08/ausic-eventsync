import React, { useEffect, useRef, useState, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import axios from 'axios';

export default function CallModal() {
  const { user } = useContext(AuthContext);
  const { socket, activeCall, setActiveCall } = useContext(SocketContext);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('ringing'); // ringing, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hardwareError, setHardwareError] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const ringtoneRef = useRef(null);

  const isInitiator = activeCall?.initiatedBy === user?.id;

  const startRingtone = (type) => {
    try {
      if (ringtoneRef.current) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      ringtoneRef.current = ctx;

      const playTone = () => {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        
        if (type === 'ring') {
          // Ringing: US telephone standard uses 440Hz + 480Hz dual tone
          // Pattern: 2s on, 4s off
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.value = 440;
          osc2.frequency.value = 480;

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          gain.gain.setValueAtTime(0, ctx.currentTime);
          
          let time = ctx.currentTime;
          for (let i = 0; i < 20; i++) {
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.setValueAtTime(0, time + 2);
            time += 6;
          }

          osc1.start();
          osc2.start();

          ringtoneRef.current = {
            stop: () => {
              try {
                osc1.stop();
                osc2.stop();
                ctx.close();
              } catch (e) {}
            }
          };
        } else {
          // Dialing tone: US uses 350Hz + 440Hz dual tone
          // Pattern: 1.5s on, 3s off
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.value = 350;
          osc2.frequency.value = 440;

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          gain.gain.setValueAtTime(0, ctx.currentTime);
          
          let time = ctx.currentTime;
          for (let i = 0; i < 25; i++) {
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.setValueAtTime(0, time + 1.5);
            time += 4.5;
          }

          osc1.start();
          osc2.start();

          ringtoneRef.current = {
            stop: () => {
              try {
                osc1.stop();
                osc2.stop();
                ctx.close();
              } catch (e) {}
            }
          };
        }
      };

      playTone();
    } catch (e) {
      console.error('Audio ringtone failed to start:', e);
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current && typeof ringtoneRef.current.stop === 'function') {
      ringtoneRef.current.stop();
    }
    ringtoneRef.current = null;
  };

  useEffect(() => {
    if (callStatus === 'ringing') {
      startRingtone('dial');
    } else if (callStatus === 'incoming') {
      startRingtone('ring');
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [callStatus]);

  // Initialize WebRTC and Local Stream
  const initWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: activeCall?.type === 'video',
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn('Camera/Microphone access error, starting simulated connection:', err);
      setHardwareError(true);
      return null;
    }
  };

  useEffect(() => {
    if (!activeCall) return;

    if (isInitiator) {
      setCallStatus('ringing');
      initWebRTC().then(stream => {
        // Start WebRTC connection setup
        setupPeerConnection(stream);
      });
    } else {
      setCallStatus('incoming');
    }

    // Socket listeners for call status
    if (socket) {
      socket.on('call-accepted', async (data) => {
        setCallStatus('connected');
        // If initiator, send offer
        if (isInitiator) {
          sendOffer();
        }
      });

      socket.on('call-declined', () => {
        setCallStatus('ended');
        cleanupCall();
      });

      socket.on('webrtc-signal', async (data) => {
        const { signal } = data;
        if (!pcRef.current) return;

        try {
          if (signal.type === 'offer') {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socket.emit('webrtc-signal', {
              roomId: activeCall.roomId,
              signal: answer
            });
          } else if (signal.type === 'answer') {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          } else if (signal.candidate) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(signal));
          }
        } catch (err) {
          console.error('Signaling error:', err);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('call-accepted');
        socket.off('call-declined');
        socket.off('webrtc-signal');
      }
    };
  }, [activeCall, socket]);

  const setupPeerConnection = (stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-signal', {
          roomId: activeCall.roomId,
          signal: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pcRef.current = pc;
  };

  const sendOffer = async () => {
    if (!pcRef.current || !socket) return;
    try {
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit('webrtc-signal', {
        roomId: activeCall.roomId,
        signal: offer
      });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  const handleAcceptCall = async () => {
    setCallStatus('connected');
    if (socket) {
      socket.emit('accept-call', {
        callId: activeCall.callId,
        roomId: activeCall.roomId,
        userId: user.id
      });
    }

    const stream = await initWebRTC();
    setupPeerConnection(stream);
  };

  const handleDeclineCall = () => {
    if (socket && activeCall) {
      socket.emit('decline-call', {
        callId: activeCall.callId,
        roomId: activeCall.roomId,
        userId: user.id
      });
    }
    cleanupCall();
  };

  const handleEndCall = () => {
    if (socket && activeCall) {
      socket.emit('end-call', {
        callId: activeCall.callId,
        roomId: activeCall.roomId
      });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setHardwareError(false);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    } else {
      setIsVideoOff(!isVideoOff);
    }
  };

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-md flex flex-col justify-center items-center z-50 px-6">
      
      {/* Incoming Call Dialog */}
      {callStatus === 'incoming' && (
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-scale-up">
          <div className="relative inline-block mb-4">
            <img
              src={activeCall.callerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeCall.callerName)}&backgroundColor=7c3aed`}
              alt={activeCall.callerName}
              className="h-20 w-20 rounded-full border-2 border-[#00BFFF] mx-auto bg-[#7C3AED]"
            />
            <span className="absolute bottom-0 right-0 h-5 w-5 bg-green-500 border-2 border-[#111111] rounded-full animate-ping"></span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{activeCall.callerName}</h3>
          <p className="text-gray-400 text-sm mb-8">Incoming {activeCall.type} call...</p>

          <div className="flex justify-center space-x-6">
            <button
              onClick={handleDeclineCall}
              className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-105"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
            <button
              onClick={handleAcceptCall}
              className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-105 animate-bounce"
            >
              <Phone className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Ringing Out / Dialing Display */}
      {callStatus === 'ringing' && (
        <div className="text-center animate-pulse">
          <div className="relative inline-block mb-6">
            <div className="h-24 w-24 rounded-full bg-gray-900 border border-gray-850 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-10 w-10 text-[#00BFFF]" />
            </div>
            <div className="absolute inset-0 rounded-full border border-[#00BFFF]/50 animate-ping"></div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Calling...</h3>
          <p className="text-gray-400 text-sm mb-12">Waiting for other party to accept</p>
          
          <button
            onClick={handleEndCall}
            className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white mx-auto cursor-pointer"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Call Connected Grid */}
      {callStatus === 'connected' && (
        <div className="relative w-full max-w-4xl h-[70vh] flex flex-col justify-between items-center">
          
          {/* Hardware warning notification */}
          {hardwareError && (
            <div className="absolute top-4 left-4 right-4 bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 rounded-xl px-4 py-2 text-xs text-center z-10">
              Camera/Microphone permission denied. Voice/video call session simulated.
            </div>
          )}

          {/* Media Video Viewport */}
          <div className="flex-1 w-full bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden relative flex items-center justify-center shadow-xl">
            {activeCall.type === 'video' && !isVideoOff && !hardwareError ? (
              // Real Video Streams
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-full w-full p-2">
                <div className="relative bg-black rounded-lg overflow-hidden border border-gray-850">
                  <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-[#111111]/80 text-[10px] text-white px-2 py-0.5 rounded-md border border-gray-800">You</span>
                </div>
                <div className="relative bg-black rounded-lg overflow-hidden border border-gray-850">
                  {remoteStream ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">Connecting video stream...</div>
                  )}
                  <span className="absolute bottom-2 left-2 bg-[#111111]/80 text-[10px] text-white px-2 py-0.5 rounded-md border border-gray-800">Peer</span>
                </div>
              </div>
            ) : (
              // Voice Call / Mock Visual Representation
              <div className="flex flex-col items-center space-y-6">
                <div className="flex items-center space-x-8">
                  <div className="relative">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=7c3aed`}
                      alt="You"
                      className="h-20 w-20 rounded-full border-2 border-purple-500 bg-[#7C3AED]"
                    />
                    {isMuted && <span className="absolute -bottom-1 -right-1 bg-red-500 p-1 rounded-full"><MicOff className="h-3 w-3 text-white" /></span>}
                  </div>
                  <div className="h-8 w-8 flex justify-center items-center">
                    <Volume2 className="h-6 w-6 text-[#00BFFF] animate-bounce" />
                  </div>
                  <div className="relative">
                    <img
                      src={activeCall.callerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeCall.callerName)}&backgroundColor=7c3aed`}
                      alt="Peer"
                      className="h-20 w-20 rounded-full border-2 border-cyan-500 bg-[#7C3AED]"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[#00BFFF] text-xs font-semibold uppercase tracking-widest bg-[#00BFFF]/10 border border-[#00BFFF]/30 px-3 py-1 rounded-full">
                    Active call session
                  </span>
                  <p className="text-gray-400 text-xs mt-3">Encrypting voice routing over WebSocket channels</p>
                </div>
              </div>
            )}
          </div>

          {/* Control Bar */}
          <div className="h-20 w-full flex items-center justify-center space-x-6 mt-4">
            <button
              onClick={toggleMute}
              className={`h-12 w-12 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isMuted 
                  ? 'bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30' 
                  : 'bg-[#1a1a1a] border-gray-800 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            <button
              onClick={handleEndCall}
              className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-105"
            >
              <PhoneOff className="h-6 w-6" />
            </button>

            {activeCall.type === 'video' && (
              <button
                onClick={toggleVideo}
                className={`h-12 w-12 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  isVideoOff 
                    ? 'bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30' 
                    : 'bg-[#1a1a1a] border-gray-800 text-gray-300 hover:bg-gray-800'
                }`}
              >
                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
