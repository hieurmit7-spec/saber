import React, { useState, useEffect } from 'react';

interface GojoSkill1EffectProps {
  onComplete: () => void;
}

/**
 * Card Overlay — Image Sequence Frames (Cách 1)
 * Dùng Explosion_5 (10 frame) đè lên thẻ nhân vật mục tiêu.
 * Render dạng absolute inset-0 bên trong card div, với aura tím/cyan toả ra ngoài.
 */
const GojoSkill1Effect: React.FC<GojoSkill1EffectProps> = ({ onComplete }) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const totalFrames = 10;
  const frameDuration = 55; // 55ms/frame → ~550ms tổng

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
      {/* Aura sấm sét toả rộng (scale lớn hơn card) */}
      <style>{`
        @keyframes gojoFlicker {
          0%, 100% { opacity: 0; }
          20%, 60% { opacity: 0.9; filter: brightness(2.5); }
          40%, 80% { opacity: 0.15; }
        }
      `}</style>

      {/* Vành tím điện từ — lớn hơn card 2x */}
      <div
        className="absolute rounded-full bg-purple-500 blur-[20px] mix-blend-screen pointer-events-none"
        style={{
          width: '200%',
          height: '200%',
          animation: 'gojoFlicker 0.5s infinite alternate',
        }}
      />
      {/* Lõi cyan chớp nháy */}
      <div
        className="absolute rounded-full bg-cyan-300 blur-[10px] mix-blend-screen pointer-events-none"
        style={{
          width: '130%',
          height: '130%',
          animation: 'gojoFlicker 0.35s infinite',
        }}
      />

      {/* 10 frames PNG — vừa khít với card */}
      {Array.from({ length: totalFrames }).map((_, i) => {
        const idx = i + 1;
        return (
          <img
            key={idx}
            src={`/animated/animated_setskill_1/PNG/Explosion_5/Explosion_${idx}.png`}
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

export default GojoSkill1Effect;
