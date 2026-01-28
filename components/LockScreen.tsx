import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Delete } from 'lucide-react';
import { PIN_CODE } from '../constants';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === PIN_CODE) {
        setIsSuccess(true);
        setTimeout(onUnlock, 800);
      } else {
        setIsError(true);
        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 500);
      }
    }
  }, [pin, onUnlock]);

  const handleNumClick = (num: string) => {
    if (pin.length < 4 && !isSuccess) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center justify-center w-full h-full max-w-sm mx-auto z-10 py-6"
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Lock Icon & Status */}
        <motion.div 
          animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="mb-6 md:mb-8 relative"
        >
          <div className={`p-4 rounded-full glass-icon ${isSuccess ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white'}`}>
            {isSuccess ? <Unlock size={40} /> : <Lock size={40} />}
          </div>
        </motion.div>

        <h2 className="text-lg md:text-xl font-light tracking-widest mb-6 md:mb-8 text-white/80 uppercase">
          {isSuccess ? "Access Granted" : "Enter PIN"}
        </h2>

        {/* PIN Dots */}
        <div className="flex gap-4 mb-8 md:mb-12">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ 
                scale: pin.length > i ? 1.2 : 1,
                backgroundColor: pin.length > i ? (isSuccess ? '#4ade80' : '#ffffff') : 'rgba(255,255,255,0.2)'
              }}
              className="w-3 h-3 md:w-4 md:h-4 rounded-full"
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 w-full px-8 max-w-[320px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumClick(num.toString())}
              className="h-14 w-14 md:h-16 md:w-16 rounded-full glass-btn text-xl md:text-2xl font-light text-white hover:bg-white/20 active:scale-95 transition-all mx-auto flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div className="col-start-2">
            <button
              onClick={() => handleNumClick('0')}
              className="h-14 w-14 md:h-16 md:w-16 rounded-full glass-btn text-xl md:text-2xl font-light text-white hover:bg-white/20 active:scale-95 transition-all mx-auto flex items-center justify-center"
            >
              0
            </button>
          </div>
          <div className="col-start-3">
             <button
              onClick={handleDelete}
              className="h-14 w-14 md:h-16 md:w-16 rounded-full text-white/70 hover:text-white active:scale-95 transition-all mx-auto flex items-center justify-center"
            >
              <Delete size={20} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};