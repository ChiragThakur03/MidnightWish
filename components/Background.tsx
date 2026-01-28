import React from 'react';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-0 bg-slate-900 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#1e1b4b] to-slate-900" />
      
      {/* Floating Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-600/10 blur-[100px] animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[100px] animate-float-slower" />
      
      {/* Dust particles - simulated with simple divs for performance */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/20 rounded-full animate-pulse" />
      <div className="absolute top-3/4 left-2/3 w-2 h-2 bg-white/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
    </div>
  );
};
