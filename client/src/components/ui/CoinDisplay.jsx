import React from 'react';

export default function CoinDisplay({ coins, label = 'Gold Coins', size = 'md', animate = false }) {
  const sizes = {
    sm:  { coin: 'text-xl', value: 'text-2xl font-black', label: 'text-xs' },
    md:  { coin: 'text-3xl', value: 'text-4xl font-black', label: 'text-sm' },
    lg:  { coin: 'text-5xl', value: 'text-6xl font-black', label: 'text-base' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center ${animate ? 'animate-bounce-in' : ''}`}>
      <span className={`${s.coin} ${animate ? 'animate-float' : ''}`}>🪙</span>
      <span className={`${s.value} text-yellow-400 tabular-nums leading-none mt-1`}>
        {(coins || 0).toLocaleString()}
      </span>
      <span className={`${s.label} text-yellow-300/70 font-medium mt-0.5`}>{label}</span>
    </div>
  );
}

// Inline coin amount for use in text/cards
export function InlineCoins({ amount, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 font-bold text-yellow-400 ${className}`}>
      🪙 {amount}
    </span>
  );
}
