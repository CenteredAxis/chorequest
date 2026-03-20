import React, { useState } from 'react';

const BUTTONS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PinPad({ kidName, kidEmoji, onSubmit, onCancel, error }) {
  const [pin, setPin] = useState('');

  const handleButton = (val) => {
    if (val === '⌫') {
      setPin(p => p.slice(0, -1));
    } else if (val === '') {
      return;
    } else if (pin.length < 4) {
      const next = pin + val;
      setPin(next);
      if (next.length === 4) {
        onSubmit(next);
        setPin('');
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Kid header */}
      <div className="text-center">
        <div className="text-5xl mb-2">{kidEmoji}</div>
        <p className="text-white font-bold text-xl font-quest">{kidName}</p>
        <p className="text-white/50 text-sm mt-1">Enter your PIN</p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              i < pin.length
                ? 'bg-yellow-400 border-yellow-400 scale-110'
                : 'bg-transparent border-white/30'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm font-semibold animate-pulse">{error}</p>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {BUTTONS.map((btn, i) => (
          <button
            key={i}
            onClick={() => handleButton(btn)}
            disabled={btn === ''}
            className={`h-16 rounded-2xl text-xl font-bold transition-all duration-100 active:scale-95 select-none
              ${btn === '' ? 'invisible' : ''}
              ${btn === '⌫'
                ? 'bg-white/10 text-white/60 hover:bg-white/20'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {btn}
          </button>
        ))}
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="text-white/40 hover:text-white/70 text-sm transition-colors mt-2"
      >
        ← Back
      </button>
    </div>
  );
}
