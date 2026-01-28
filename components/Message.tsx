import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface MessageProps {
  onRestart?: () => void;
}

export const Message: React.FC<MessageProps> = () => {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full flex flex-col items-center justify-center px-4 py-8 z-20"
    >
      <div className="glass-card w-full max-w-md p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-center">
        {/* Decorative background blurs */}
        <div className="absolute -top-10 -right-10 w-24 h-24 md:w-32 md:h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 md:w-32 md:h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <h2 className="text-2xl md:text-3xl font-serif text-white mb-4 md:mb-6">Make a Wish</h2>
          
          <div className="space-y-3 md:space-y-4 text-indigo-100 leading-relaxed font-light text-base md:text-lg">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              May this year bless you with as much joy as you bring to the world. Stay true, stay magical, stay बे-निशां always.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              May your smile never fade and your dreams always find their way.
            </motion.p>
             <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              className="font-semibold text-white pt-2 md:pt-4"
            >
              Happy Birthday! 🎉
            </motion.p>
          </div>
        </div>
      </div>

      {/* Secret Note Section */}
      <div className="mt-8 md:mt-12 text-center">
        <button 
          onClick={() => setShowSecret(!showSecret)}
          className="text-white/30 text-xs hover:text-white/60 transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <MessageCircle size={12} />
          <span>don't click it</span>
        </button>

        <AnimatePresence>
          {showSecret && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-3 md:p-4 rounded-lg bg-black/20 border border-white/5 mx-auto max-w-[280px]">
                <p className="text-xs text-indigo-200/70 italic">
                  "I know we don't talk much, but I hope this made you smile."
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};