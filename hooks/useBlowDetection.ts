import { useState, useEffect, useRef, useCallback } from 'react';

export const useBlowDetection = (
  isActive: boolean,
  threshold: number = 25, // Sensitivity: lower is more sensitive, but background noise might trigger
  onBlowDetected: () => void
) => {
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);

  const stopListening = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);

      setIsListening(true);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const detectBlow = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        // Focus on lower frequencies where "wind/blowing" sound usually lives
        const lowFreqCount = Math.floor(bufferLength / 2); 
        for (let i = 0; i < lowFreqCount; i++) {
          sum += dataArray[i];
        }
        const average = sum / lowFreqCount;
        
        setVolume(average);

        // Check threshold
        if (average > threshold) {
          onBlowDetected();
          stopListening(); // Stop immediately after detection
        } else {
          requestRef.current = requestAnimationFrame(detectBlow);
        }
      };

      detectBlow();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Please allow microphone access to blow out the candles!");
    }
  }, [threshold, onBlowDetected, stopListening]);

  // Cleanup on unmount or when isActive becomes false
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { isListening, volume, startListening };
};
