'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CapsuleMessage {
  id: string;
  name: string;
  location: string;
  avatar: string;
  summary: string;
  year: number;
}

const GLOBAL_VAULT: CapsuleMessage[] = [
  { id: '1', name: 'Marta', location: 'Warsaw, Poland', avatar: '👩‍🔬', summary: 'I hope the Baltic glaciers are preserved and that my children walk on clean beaches.', year: 2030 },
  { id: '2', name: 'Achieng', location: 'Nairobi, Kenya', avatar: '👩‍🌾', summary: 'I promise to plant 500 indigenous trees by 2030 to restore our riverbasin water cycle.', year: 2030 },
  { id: '3', name: 'Kenji', location: 'Tokyo, Japan', avatar: '👨‍💻', summary: 'My commitment is to move my design studio completely off-grid and teach slow eating.', year: 2030 },
  { id: '4', name: 'Liam', location: 'Melbourne, Australia', avatar: '👨‍🎨', summary: 'I hope we look back at coal plants as relics of the past. Walking barefoot on cool sand.', year: 2030 },
];

export function TimeCapsule() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [vaultMessages, setVaultMessages] = useState<CapsuleMessage[]>(GLOBAL_VAULT);
  const [hasRecordedSelf, setHasRecordedSelf] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Calculate 2030 countdown
  useEffect(() => {
    const targetDate = new Date('2030-01-01T00:00:00Z').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  // Handle Recording Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, stopRecording]);

  const startRecording = async () => {
    setError('');
    setVideoBlob(null);
    setVideoUrl('');
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: true,
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error(err);
      setError('Could not access camera/microphone. Simulating text capsule.');
      setIsRecording(true);
      setRecordingTime(0);
    }
  };



  const saveCapsule = () => {
    const selfMsg: CapsuleMessage = {
      id: Math.random().toString(),
      name: 'You (Reflective Capsule)',
      location: 'Local Hive',
      avatar: '🌍',
      summary: 'Saved capsule to Earth 2030: A commitment to mindful consumption and reciprocity.',
      year: 2030,
    };
    setVaultMessages([selfMsg, ...vaultMessages]);
    setHasRecordedSelf(true);
    setVideoBlob(null);
    setVideoUrl('');
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>⏳</span> Carbon Time Capsule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-ink-soft">
          Record a 30-second promise to "The Earth in 2030". Your message is sealed in a global digital vault, counting down to release. Listen to others around the globe.
        </p>

        {/* Countdown Board */}
        <div className="grid grid-cols-4 gap-2 bg-forest-deep/10 p-3 rounded-xl text-center border border-forest-action/20">
          <div>
            <div className="font-mono text-lg font-bold text-forest-deep">{countdown.days}</div>
            <div className="text-[9px] text-ink-soft uppercase font-bold">Days</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-forest-deep">{countdown.hours}</div>
            <div className="text-[9px] text-ink-soft uppercase font-bold">Hours</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-forest-deep">{countdown.minutes}</div>
            <div className="text-[9px] text-ink-soft uppercase font-bold">Mins</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-forest-deep">{countdown.seconds}</div>
            <div className="text-[9px] text-ink-soft uppercase font-bold">Secs</div>
          </div>
        </div>

        {/* Recorder Box */}
        <div className="flex flex-col items-center border border-border rounded-xl p-4 bg-white/50 backdrop-blur-sm">
          {isRecording ? (
            <div className="w-full flex flex-col items-center space-y-3">
              {cameraStream ? (
                <video ref={videoRef} autoPlay playsInline className="w-64 h-48 rounded-lg bg-black object-cover" />
              ) : (
                <div className="w-64 h-48 rounded-lg bg-black flex flex-col items-center justify-center text-white space-y-2">
                  <span className="text-xl animate-pulse text-red-500">⏺</span>
                  <span className="text-xs text-white/80">(Text capsule recording in progress)</span>
                </div>
              )}
              {/* Progress Bar */}
              <div className="w-64">
                <div className="flex justify-between text-xs text-ink-soft mb-1">
                  <span>Recording...</span>
                  <span>{recordingTime}s / 30s</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${(recordingTime / 30) * 100}%` }} />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={stopRecording}>Stop Recording</Button>
            </div>
          ) : videoUrl ? (
            <div className="w-full flex flex-col items-center space-y-3">
              <video src={videoUrl} controls className="w-64 h-48 rounded-lg bg-black object-cover" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={startRecording}>Re-record</Button>
                <Button variant="primary" size="sm" onClick={saveCapsule}>Seal in Vault</Button>
              </div>
            </div>
          ) : !hasRecordedSelf ? (
            <div className="text-center py-4 space-y-2">
              <span className="text-3xl">📹</span>
              <p className="text-xs text-ink-soft">Record your hope or promise for 2030.</p>
              {error && <p className="text-[10px] text-sunlight-amber">{error}</p>}
              <Button variant="primary" size="sm" onClick={startRecording}>Record 30s Message</Button>
            </div>
          ) : (
            <div className="text-center py-4 text-emerald-600 font-semibold text-xs flex items-center gap-1.5">
              <span>✓</span> Your capsule is sealed in the vault until January 1, 2030!
            </div>
          )}
        </div>

        {/* Global Vault */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-forest-deep uppercase tracking-wider font-mono">Global Vault Promises</h4>
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
            {vaultMessages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-xl border border-border bg-white/40 flex items-start gap-3">
                <span className="text-2xl">{msg.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink">{msg.name} · <span className="text-ink-soft">{msg.location}</span></p>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed italic">"{msg.summary}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
