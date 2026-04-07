import React, { useState, useEffect } from 'react';

interface PeterSkill1EffectProps {
  onComplete: () => void;
}

/**
 * Card Overlay — Image Sequence Frames (Cách 1)
 * Chiêu 1 Peter: "Nắm Đấm Say Xỉn" — dùng Explosion_9 (10 frame).
 * Kèm ánh sáng xanh lá loè rượu đặc trưng của Peter.
 */
const PeterSkill1Effect: React.FC<PeterSkill1EffectProps> = ({ onComplete }) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const totalFrames = 10;
  const frameDuration = 50; // 50ms/frame → ~500ms tổng

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
      {/* Aura rượu xanh lá — toả rộng hơn card */}
      <style>{`
        @keyframes peterPunch {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          25%, 75%  { opacity: 0.85; transform: scale(1.1); filter: hue-rotate(20deg) brightness(1.8); }
          50%       { opacity: 0.4; transform: scale(0.95); }
        }
      `}</style>

      {/* Vầng sáng xanh lá rừng rực (đặc trưng Peter) */}
      <div
        className="absolute rounded-full bg-green-400 blur-[18px] mix-blend-screen pointer-events-none"
        style={{
          width: '180%',
          height: '180%',
          animation: 'peterPunch 0.45s infinite',
        }}
      />
      {/* Lõi vàng chớp cú đấm */}
      <div
        className="absolute rounded-full bg-yellow-300 blur-[8px] mix-blend-screen pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          animation: 'peterPunch 0.3s infinite reverse',
        }}
      />

      {/* 10 frames PNG từ Explosion_9 — vừa khít card */}
      {Array.from({ length: totalFrames }).map((_, i) => {
        const idx = i + 1;
        return (
          <img
            key={idx}
            src={`/animated/animated_setskill_1/PNG/Explosion_9/Explosion_${idx}.png`}
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

export default PeterSkill1Effect;
