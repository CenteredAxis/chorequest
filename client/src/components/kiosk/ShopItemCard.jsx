import React from 'react';

export default function ShopItemCard({ item, myCoins, onRedeem }) {
  const canAfford = myCoins >= item.coin_cost;

  return (
    <div className={`rounded-2xl border-2 p-4 transition-all duration-150 ${
      canAfford
        ? 'border-yellow-500/30 bg-white/5 hover:bg-white/10'
        : 'border-white/5 bg-white/[0.02] opacity-60'
    }`}>
      <div className="text-center mb-3">
        <span className="text-4xl">{item.icon_emoji ?? '🎁'}</span>
      </div>
      <p className="text-white font-bold text-center text-sm truncate">{item.name}</p>
      {item.description && (
        <p className="text-white/40 text-xs text-center mt-1 line-clamp-2">{item.description}</p>
      )}
      <div className="flex items-center justify-center gap-1 mt-3 text-yellow-400 font-bold text-sm">
        <span>🪙</span>
        <span>{item.coin_cost}</span>
      </div>
      <button
        onClick={onRedeem}
        disabled={!canAfford}
        className={`w-full mt-3 py-2 rounded-xl text-sm font-bold transition-all duration-150 active:scale-95
          ${canAfford
            ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300'
            : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
      >
        {canAfford ? '🛒 Redeem' : '🔒 Need more coins'}
      </button>
    </div>
  );
}
