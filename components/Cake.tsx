import React, { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Wind, HelpCircle } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Cylinder, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useBlowDetection } from '../hooks/useBlowDetection';

// --- 3D SUB-COMPONENTS ---

// 1. Dynamic Flame Component
const Flame = ({ isBlown, windVolume }: { isBlown: boolean; windVolume: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const offset = useMemo(() => Math.random() * 100, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime + offset;
    
    if (isBlown) {
        // Snuff out animation
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0.5, delta * 2);
        meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 0, delta * 3);
        meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 0, delta * 5);
        meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 0, delta * 5);
        if (lightRef.current) lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, delta * 8);
        return;
    }

    const baseScale = 1 + Math.sin(time * 15) * 0.1 + Math.cos(time * 5) * 0.1;
    const windShake = (windVolume / 50) * Math.sin(time * 50); 
    const windShrink = Math.max(0, 1 - (windVolume / 100)); 

    meshRef.current.scale.set(
      baseScale * windShrink, 
      (baseScale + Math.abs(windShake)) * windShrink, 
      baseScale * windShrink
    );
    meshRef.current.rotation.z = windShake * 0.5; 
    meshRef.current.rotation.x = Math.cos(time * 10) * 0.1;

    if (lightRef.current) {
        lightRef.current.intensity = 1.5 + Math.sin(time * 20) * 0.5 - (windVolume / 100);
    }
  });

  return (
    <group position={[0, 0.35, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial 
          emissive={new THREE.Color("#ffaa00")}
          emissiveIntensity={3}
          color={"#ff5500"}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight ref={lightRef} distance={1.5} decay={2} color="#ffaa00" intensity={1.5} />
    </group>
  );
};

// 2. Smoke Component
const Smoke = ({ isBlown }: { isBlown: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    return new Array(8).fill(0).map(() => ({
      initialPos: new THREE.Vector3((Math.random()-0.5)*0.05, 0.35, (Math.random()-0.5)*0.05),
      velocity: new THREE.Vector3((Math.random()-0.5)*0.02, 0.2+Math.random()*0.1, (Math.random()-0.5)*0.02),
      rotSpeed: (Math.random()-0.5)*2,
      scale: 0.05 + Math.random()*0.1,
    }));
  }, []);

  useFrame((state, delta) => {
    if (!isBlown || !groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const material = mesh.material as THREE.MeshStandardMaterial;
      const p = particles[i];
      mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y *= 0.98;
      const currentScale = mesh.scale.x;
      const targetScale = p.scale * 3;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 0.5);
      mesh.scale.setScalar(newScale);
      if (material.opacity > 0) material.opacity -= delta * 0.4;
      if (material.opacity <= 0) mesh.visible = false;
    });
  });

  if (!isBlown) return null;

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.initialPos} scale={[0.1, 0.1, 0.1]}>
          <dodecahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial color="#a0a0a0" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

// 3. Candle Component
interface CandleProps {
  position: [number, number, number];
  color?: string;
  isBlown: boolean;
  isLit: boolean;
  windVolume: number;
}

const Candle: React.FC<CandleProps> = ({ position, color, isBlown, isLit, windVolume }) => {
  return (
    <group position={position}>
      {/* Candle Body */}
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 16]} />
        <meshStandardMaterial color={color || "#ff4081"} roughness={0.3} />
      </mesh>
      
      {/* Wick */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.06, 8]} />
        <meshBasicMaterial color="#333" />
      </mesh>

      {/* Interactive Elements - Only render if Lit */}
      {isLit && (
        <group position={[0, 0.2, 0]}>
            <Flame isBlown={isBlown} windVolume={windVolume} />
            <Smoke isBlown={isBlown} />
        </group>
      )}
    </group>
  );
};

// 4. Decoration Components
const Piping: React.FC<{ radius: number; y: number; count?: number; color?: string; startAngle?: number; endAngle?: number }> = ({ 
    radius, y, count = 24, color = "#FFF", startAngle = 0, endAngle = Math.PI * 2 
}) => {
  const blobs = useMemo(() => {
    const items = [];
    const totalAngle = endAngle - startAngle;
    
    // We want to maintain density
    const density = 24 / (Math.PI * 2); 
    const actualCount = Math.floor(density * totalAngle) || 1;

    for (let i = 0; i <= actualCount; i++) {
        const angle = startAngle + (i / actualCount) * totalAngle;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        items.push({ pos: [x, 0, z] as [number, number, number] });
    }
    return items;
  }, [radius, count, startAngle, endAngle]);

  return (
    <group position={[0, y, 0]}>
      {blobs.map((blob, i) => (
        <mesh key={i} position={blob.pos} castShadow receiveShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
};

const Sprinkles: React.FC<{ count: number; radius: number; y: number; startAngle?: number; endAngle?: number }> = ({ 
    count, radius, y, startAngle = 0, endAngle = Math.PI * 2 
}) => {
  const sprinkles = useMemo(() => {
    const items = [];
    let attempts = 0;
    while(items.length < count && attempts < count * 5) {
        attempts++;
        const angle = Math.random() * (endAngle - startAngle) + startAngle;
        const r = Math.sqrt(Math.random()) * radius;
        
        items.push({
            x: Math.cos(angle) * r,
            z: Math.sin(angle) * r,
            rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
            color: ['#FF69B4', '#4FC3F7', '#FFEB3B', '#B39DDB', '#C5E1A5'][Math.floor(Math.random() * 5)]
        });
    }
    return items;
  }, [count, radius, startAngle, endAngle]);

  return (
    <group position={[0, y, 0]}>
      {sprinkles.map((s, i) => (
        <mesh key={i} position={[s.x, 0, s.z]} rotation={s.rot}>
          <capsuleGeometry args={[0.015, 0.05, 4, 8]} />
          <meshStandardMaterial color={s.color} />
        </mesh>
      ))}
    </group>
  );
};

// 6. Balloon Component
const Balloon = ({ position, color, scale = 1, delay = 0 }: { position: [number, number, number], color: string, scale?: number, delay?: number }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime() + delay;
    group.current.position.y = position[1] + Math.sin(t * 1) * 0.1; // Bobbing
    group.current.rotation.z = Math.sin(t * 0.5) * 0.05; // Swaying
    group.current.rotation.x = Math.cos(t * 0.3) * 0.02; 
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Knot */}
      <mesh position={[0, -0.38, 0]}>
        <coneGeometry args={[0.08, 0.08, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* String */}
      <mesh position={[0, -1, 0]}>
         <cylinderGeometry args={[0.005, 0.005, 1.2]} />
         <meshBasicMaterial color="#CCC" opacity={0.5} transparent />
      </mesh>
    </group>
  );
};

// 5. Main Cake Model
const CakeModel = ({ isBlown, isLit, windVolume }: { isBlown: boolean, isLit: boolean, windVolume: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const candleCount = 8;
  const candleRadius = 0.6;

  // Simple circle of candles
  const candles = useMemo(() => Array.from({ length: candleCount }).map((_, i) => {
    const angle = (i / candleCount) * Math.PI * 2;
    return {
      x: Math.cos(angle) * candleRadius,
      z: Math.sin(angle) * candleRadius,
      color: ["#F48FB1", "#CE93D8", "#90CAF9", "#80CBC4"][i % 4],
    };
  }), []);

  return (
    <group ref={groupRef} position={[0, -1.0, 0]}>
        {/* Whole Cake Group */}
        <group>
             {/* Bottom Tier */}
            <group position={[0, 0.5, 0]}>
                <Cylinder args={[1.2, 1.2, 1, 32]} castShadow receiveShadow>
                    <meshStandardMaterial color="#F48FB1" roughness={0.4} />
                </Cylinder>
                <Piping radius={1.25} y={-0.45} />
                <Piping radius={1.2} y={0.5} />
            </group>

             {/* Top Tier */}
             <group position={[0, 1.3, 0]}>
                <Cylinder args={[0.9, 0.9, 0.8, 32]} castShadow receiveShadow>
                    <meshStandardMaterial color="#F48FB1" roughness={0.4} />
                </Cylinder>
                <Piping radius={0.95} y={-0.35} />
                
                {/* White Frosting Top */}
                <Cylinder position={[0, 0.405, 0]} args={[0.9, 0.9, 0.05, 32]}>
                    <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.05} />
                </Cylinder>
                
                <Sprinkles count={60} radius={0.8} y={0.44} />
                <Piping radius={0.85} y={0.45} />
            </group>

            {/* Candles */}
            <group position={[0, 1.7, 0]}>
                {candles.map((c, i) => (
                    <Candle key={i} position={[c.x, 0, c.z]} color={c.color} isBlown={isBlown} isLit={isLit} windVolume={windVolume} />
                ))}
            </group>
        </group>
      
      {/* Plate */}
      <Cylinder args={[1.5, 1.4, 0.1, 64]} position={[0, -0.05, 0]} receiveShadow>
        <meshStandardMaterial color="#F5F5F5" roughness={0.1} metalness={0.4} />
      </Cylinder>
    </group>
  );
};


// --- MAIN REACT COMPONENT ---

interface CakeProps {
  onCandlesBlown: () => void;
  name?: string;
}

export const Cake: React.FC<CakeProps> = ({ onCandlesBlown, name = "Someone Special" }) => {
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [isLit, setIsLit] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Use useCallback to ensure the function reference is stable
  const handleBlow = useCallback(() => {
    if (!candlesBlown) {
      setCandlesBlown(true);
      // Automatically transition after a short delay for smoke/celebration
      setTimeout(() => {
        onCandlesBlown();
      }, 3500);
    }
  }, [candlesBlown, onCandlesBlown]);

  const { isListening, volume, startListening } = useBlowDetection(permissionGranted, 50, handleBlow);

  const handleLightCandles = () => {
    setIsLit(true);
    setPermissionGranted(true);
    startListening();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-between w-full h-full z-10 relative pt-16 pb-8 px-4"
    >
      <div className="w-full text-center z-20 shrink-0">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center justify-center"
        >
          <h1 className="font-playwrite text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-indigo-200 to-pink-200 drop-shadow-sm p-4 leading-loose">
            Happiest Birthday
          </h1> 
          <div className="font-poppins text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-indigo-200 to-pink-200 drop-shadow-sm p-4 leading-relaxed">
            {name}
          </div>
        </motion.div>
      </div>

      {/* 3D Scene */}
      <div className="w-full flex-1 min-h-0 cursor-grab active:cursor-grabbing relative">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 3, 6], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={1} castShadow />
          <Environment preset="night" />
          
          <CakeModel 
              isBlown={candlesBlown} 
              isLit={isLit} 
              windVolume={isListening ? volume : 0} 
          />

          {/* Decorative Elements */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Sparkles count={50} scale={6} size={2} speed={0.4} opacity={0.5} color="#FFF" />
          
          <Balloon position={[-2.2, 0.5, -2]} color="#F48FB1" delay={0} />
          <Balloon position={[2.2, 1, -2]} color="#9FA8DA" delay={2} />
          <Balloon position={[-2.8, 1.8, -3]} color="#CE93D8" delay={4} />
          <Balloon position={[2.5, -0.5, -1.5]} color="#80CBC4" delay={1} />

          <ContactShadows position={[0, -1.6, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
        </Canvas>
      </div>

      {/* UI Overlay Controls */}
      <div className="w-full shrink-0 z-20 flex justify-center min-h-[80px]">
        {!candlesBlown && (
          <div className="text-center w-full max-w-sm">
            {!isLit ? (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLightCandles}
                className="glass-btn px-6 py-3 rounded-full flex items-center justify-center gap-2 text-indigo-100 mx-auto border border-indigo-400/30 bg-indigo-900/30 backdrop-blur-md w-full"
              >
                <span className="text-base font-light tracking-wide">Tap to Light Candles</span>
              </motion.button>
            ) : (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex flex-col items-center gap-3 p-4 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5 w-full"
               >
                 <div className="flex items-center gap-2 text-indigo-200">
                    <Mic size={18} className={volume > 10 ? "animate-pulse text-pink-300" : ""} />
                    <span className="font-light tracking-wider uppercase text-sm">Now Blow The Candles</span>
                 </div>
                 
                 <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                   <motion.div 
                     className="h-full bg-gradient-to-r from-orange-400 to-pink-500 shadow-[0_0_10px_rgba(255,165,0,0.5)]"
                     animate={{ width: `${Math.min(volume * 2.5, 100)}%` }}
                     transition={{ type: "spring", stiffness: 300, damping: 20 }}
                   />
                 </div>

                 <div className="relative mt-1">
                    <button 
                        onClick={() => setShowHint(!showHint)}
                        className="flex items-center gap-1 text-white/50 text-xs hover:text-white/80 transition-colors"
                    >
                        <HelpCircle size={12} />
                        <span>Hint</span>
                    </button>
                    
                    <AnimatePresence>
                        {showHint && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900/90 border border-white/10 p-3 rounded-lg text-xs text-center text-white/90 backdrop-blur-md"
                            >
                                Blow air into your device's microphone to blow out the candles!
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/90" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                 </div>
               </motion.div>
            )}
          </div>
        )}
        
        {candlesBlown && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/80 font-serif italic text-lg"
            >
                Making a wish...
            </motion.div>
        )}
      </div>
    </motion.div>
  );
};