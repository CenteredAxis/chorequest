import React from 'react';

const STATUS_STYLE = {
  open:        'border-white/10 bg-white/5',
  claimed:     'border-yellow-500/40 bg-yellow-500/10',
  pending:     'border-blue-500/40 bg-blue-500/10',
  approved:    'border-green-500/40 bg-green-500/10',
};

function getStars(xp) {
  if (xp >= 25) return '⭐⭐⭐';
  if (xp >= 12) return '⭐⭐';
  return '⭐';
}

export default function ChoreCard({ chore, narrative, onClaim, onJoin, onSubmit }) {
  const stars = getStars(chore.xp_reward || 0);
  const style = STATUS_STYLE[chore.status] ?? STATUS_STYLE.open;

  return (
    <div className={`rounded-2xl border-2 p-4 transition-all duration-150 flex flex-col ${style}`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl">{chore.icon_emoji ?? '📋'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold">{chore.title}</p>
          {narrative ? (
            <p className="text-yellow-200/70 text-xs mt-0.5 italic line-clamp-3">{narrative}</p>
          ) : chore.description && (
            <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{chore.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
            <span>{stars}</span>
            <span>🪙 {chore.coin_reward}</span>
            <span>✨ {chore.xp_reward} XP</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-3">
        {onClaim && (
          <button
            onClick={onClaim}
            className="flex-1 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-sm font-bold transition-colors active:scale-95"
          >
            ⚔️ Claim
          </button>
        )}
        {onJoin && (
          <button
            onClick={onJoin}
            className="flex-1 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-bold transition-colors active:scale-95"
          >
            🤝 Join
          </button>
        )}
        {onSubmit && (
          <button
            onClick={onSubmit}
            className="flex-1 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm font-bold transition-colors active:scale-95"
          >
            ✅ Done!
          </button>
        )}
        {!onClaim && !onJoin && !onSubmit && (
          <div className="flex-1 py-2 text-center text-white/30 text-sm">
            {chore.status === 'pending' ? '⏳ Awaiting approval' : '✅ Complete'}
          </div>
        )}
      </div>
    </div>
  );
}
