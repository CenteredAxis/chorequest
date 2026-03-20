import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

export default function ConfettiOverlay({ active, message, coins, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    setVisible(true);

    // Fire confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#fbbf24', '#f59e0b', '#22c55e', '#60a5fa', '#a78bfa']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#fbbf24', '#f59e0b', '#22c55e', '#60a5fa', '#a78bfa']
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 3500);

    return () => clearTimeout(timer);
  }, [active, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="text-center animate-bounce-in pointer-events-auto" onClick={onDone}>
        <div className="text-7xl mb-4 animate-float">🎉</div>
        {message && (
          <div className="text-3xl font-black text-white drop-shadow-lg font-quest px-8 text-center">
            {message}
          </div>
        )}
        {coins != null && (
          <div className="text-5xl font-black text-yellow-400 mt-3 drop-shadow-lg">
            +{coins} 🪙
          </div>
        )}
        <div className="text-white/60 text-sm mt-4">Tap anywhere to continue</div>
      </div>
    </div>
  );
}
