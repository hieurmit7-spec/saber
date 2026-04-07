import React, { useState, useEffect } from 'react';

interface SasukeSkill1EffectProps {
  onComplete: () => void;
}

/**
 * Card Overlay — Image Sequence Frames (Cách 1)
 * Chiêu 1 Sasuke: "Chidori" — dùng Explosion_7/1 (5 frame).
 * Kèm aura sấm sét tím/trắng đặc trưng Chidori.
 */
const SasukeSkill1Effect: React.FC<SasukeSkill1EffectProps> = ({ onComplete }) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const totalFrames = 5;
  const frameDuration = 60; // 60ms/frame → ~300ms tổng (nhanh như chớp đặc trưng Chidori)

  useEffect(() => {
    setCurrentFrame(1);
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= totalFrames) {
          clearInterval(interval);
          onComplete();
          return 1;
        }
        return prev + 1;
      });
    }, frameDuration);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none overflow-visible">
      <style>{`
        @keyframes chidoriFlash {
          0%, 100% { opacity: 0; }
          20%, 60% { opacity: 1; filter: brightness(3) saturate(2); }
          40%, 80% { opacity: 0.25; }
        }
      `}</style>

      {/* Lõi trắng Chidori — cực sáng, chớp nhanh */}
      <div
        className="absolute rounded-full bg-white blur-[12px] mix-blend-screen pointer-events-none"
        style={{
          width: '120%',
          height: '120%',
          animation: 'chidoriFlash 0.3s infinite',
        }}
      />
      {/* Vành tím sấm sét Sharingan — toả rộng */}
      <div
        className="absolute rounded-full bg-purple-400 blur-[22px] mix-blend-screen pointer-events-none"
        style={{
          width: '200%',
          height: '200%',
          animation: 'chidoriFlash 0.4s infinite reverse',
        }}
      />

      {/* 5 frames PNG từ Explosion_7/1 — vừa khít card */}
      {Array.from({ length: totalFrames }).map((_, i) => {
        const idx = i + 1;
        return (
          <img
            key={idx}
            src={`/animated/animated_setskill_1/PNG/Explosion_7/1/Explosion_${idx}.png`}
            alt=""
            className={`absolute w-full h-full object-contain transition-none ${
              idx === currentFrame ? 'opacity-100' : 'opacity-0'
            }`}
          />
        );
      })}
    </div>
  );
};

export default SasukeSkill1Effect;
