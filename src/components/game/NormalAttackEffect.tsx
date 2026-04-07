import React, { useState, useEffect } from 'react';

interface NormalAttackEffectProps {
  onComplete: () => void;
}

/**
 * Card Overlay — Image Sequence Frames (Cách 1)
 * Dùng Explosion_1 (10 frame) đè lên thẻ nhân vật mục tiêu.
 * Render dạng absolute inset-0 bên trong card div (w-24 h-24).
 */
const NormalAttackEffect: React.FC<NormalAttackEffectProps> = ({ onComplete }) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const totalFrames = 10;
  const frameDuration = 40; // 40ms/frame → ~400ms tổng

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
      {Array.from({ length: totalFrames }).map((_, i) => {
        const idx = i + 1;
        return (
          <img
            key={idx}
            src={`/animated/animated_setskill_1/PNG/Explosion_1/Explosion_${idx}.png`}
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

export default NormalAttackEffect;
