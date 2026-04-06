import React from 'react';
import { cn } from "@/lib/utils";

interface EquipmentIconProps {
  type: 'shoes' | 'hat' | 'armor' | 'ring' | 'belt' | 'artifact' | string;
  level: number;
  rarity?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EquipmentIcon: React.FC<EquipmentIconProps> = ({ 
  type, 
  level, 
  className,
  size = 'md'
}) => {
  const iconPath = `/icon rpg/${type}.png`;
  
  // VFX Logic
  let dotCount = 0;
  let dotColor = '';
  let orbitDuration = '4s';
  let showLightning = false;
  let showAura = false;

  if (level >= 1 && level <= 4) {
    dotCount = level;
    dotColor = '#60a5fa'; // Azure Blue
    orbitDuration = '3s';
    showAura = true;
  } else if (level >= 5 && level <= 7) {
    dotCount = level - 4;
    dotColor = '#10b981'; // Emerald Green
    orbitDuration = '2.5s';
    showAura = true;
  } else if (level >= 8 && level <= 11) {
    dotCount = level - 7;
    dotColor = '#f59e0b'; // Vibrant Orange
    orbitDuration = '1.8s';
    showAura = true;
  } else if (level >= 12) {
    dotCount = Math.min(5, level - 11);
    dotColor = '#ef4444'; // Crimson Red
    orbitDuration = '0.6s'; // Rất nhanh
    showLightning = true;
    showAura = true;
  }

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  return (
    <div className={cn("relative flex items-center justify-center p-2", sizeClasses[size], className)}>
      {/* Glow Aura for high levels */}
      {showAura && (
        <div 
          className="animate-pulse-aura vfx-aurora" 
          style={{ color: dotColor }}
        />
      )}

      {/* Base Icon */}
      <img 
        src={iconPath} 
        alt={type} 
        className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/icon rpg/artifact.png';
        }}
      />

      {/* Orbiting Dots */}
      {[...Array(dotCount)].map((_, i) => {
        const delay = -(i * (parseFloat(orbitDuration) / dotCount)) + 's';
        return (
          <div
            key={i}
            className="animate-orbit vfx-dot"
            style={{ 
              color: dotColor,
              backgroundColor: dotColor,
              animationDuration: orbitDuration,
              animationDelay: delay,
              boxShadow: `0 0 10px ${dotColor}, 0 0 20px ${dotColor}${level >= 12 ? ', 0 0 5px #fff' : ''}`
            }}
          >
            {/* Fiery Tail for high levels */}
            {level >= 12 && (
              <div 
                className="absolute inset-x-[-10px] h-[2px] bg-gradient-to-r from-transparent via-red-500 to-white opacity-60 rounded-full"
                style={{ 
                  transform: 'rotate(90deg)',
                  filter: 'blur(1px)'
                }}
              />
            )}
          </div>
        );
      })}

      {/* Lightning Effect */}
      {showLightning && (
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden animate-lightning">
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-70">
            <path 
              d="M 50 10 L 45 40 L 60 35 L 50 90 L 55 50 L 40 55 Z" 
              fill="white" 
              className="drop-shadow-[0_0_5px_#ef4444]"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
