import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX, ArrowLeft } from 'lucide-react';

import { LockScreen } from './components/LockScreen';
import { Cake } from './components/Cake';
import { Message } from './components/Message';
import { Background } from './components/Background';
import { AppPhase } from './types';
import { CONFETTI_CONFIG, MUSIC_URL } from './constants';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.LOCKED);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [hasBlownCandles, setHasBlownCandles] = useState(false); // New state to persist cake state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Ref to track current phase for async operations like confetti
  const phaseRef = useRef<AppPhase>(AppPhase.LOCKED);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    // Initialize Audio
    audioRef.current = new Audio(MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4; // Soft background volume

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        // Promise handling for browsers requiring interaction
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const handleUnlock = () => {
    setPhase(AppPhase.REVEAL);
    phaseRef.current = AppPhase.REVEAL; // IMMEDIATE UPDATE: Fix race condition where useEffect hasn't run yet
    
    // Trigger Confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      // If user navigated away from REVEAL (e.g. clicked back), stop the animation loop affecting state
      if (phaseRef.current !== AppPhase.REVEAL) return;

      confetti({
        ...CONFETTI_CONFIG,
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        ...CONFETTI_CONFIG,
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        // Transition to Candle Phase after confetti settles
        // Double check we are still in REVEAL before moving forward
        if (phaseRef.current === AppPhase.REVEAL) {
          setTimeout(() => setPhase(AppPhase.CANDLE), 500);
        }
      }
    };
    frame();

    // Try to auto-play music on unlock (might still be blocked depending on browser heuristics, but worth a try)
    if (audioRef.current && !isMusicPlaying) {
      audioRef.current.play().then(() => setIsMusicPlaying(true)).catch(() => {
        // If blocked, we rely on the user toggling it later or the mic permission click
      });
    }
  };

  const handleCandlesBlown = () => {
    setHasBlownCandles(true); // Persist state so going back doesn't reset the game
    setPhase(AppPhase.MESSAGE);
  };

  const handleBack = () => {
    if (phase === AppPhase.MESSAGE) {
      setPhase(AppPhase.CANDLE);
    } else if (phase === AppPhase.CANDLE) {
      setPhase(AppPhase.LOCKED);
    } else if (phase === AppPhase.REVEAL) {
      setPhase(AppPhase.LOCKED);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden">
      <Background />
      
      {/* Global Style overrides for Glassmorphism */}
      <style>{`
        .glass-icon {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .glass-btn {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
        }
      `}</style>

      {/* Back Button (Only visible if not Locked) */}
      {phase !== AppPhase.LOCKED && (
        <div className="absolute top-4 left-4 z-50">
          <button 
            onClick={handleBack}
            className="p-3 rounded-full glass-btn text-white/70 hover:text-white transition-colors"
            aria-label="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
      )}

      {/* Music Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={toggleMusic}
          className="p-3 rounded-full glass-btn text-white/70 hover:text-white transition-colors"
        >
          {isMusicPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {phase === AppPhase.LOCKED && (
          <LockScreen key="lock" onUnlock={handleUnlock} />
        )}

        {phase === AppPhase.REVEAL && (
           <motion.div
             key="reveal"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="text-white text-2xl font-serif z-10"
           >
             Unlocking Thoda sa KHAAS ...
           </motion.div>
        )}

        {phase === AppPhase.CANDLE && (
          <Cake 
            key="cake" 
            onCandlesBlown={handleCandlesBlown} 
            name="बेनिशा"
            initialBlown={hasBlownCandles} 
          />
        )}

        {phase === AppPhase.MESSAGE && (
          <Message key="message" />
        )}
      </AnimatePresence>
    </div>
  );
}