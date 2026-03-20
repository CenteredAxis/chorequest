import React from 'react';
import { badges as badgesApi } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { QuestLoadingScreen } from '../../components/ui/Spinner.jsx';

export default function KioskBadges() {
  const { data: catalog, loading: loadCatalog } = useApi(() => badgesApi.catalog(), []);
  const { data: earned,  loading: loadEarned  } = useApi(() => badgesApi.mine(),    []);

  if (loadCatalog || loadEarned) return <QuestLoadingScreen />;

  const earnedIds = new Set((earned || []).map(b => b.id));
  const earnedCount = earnedIds.size;
  const totalCount = (catalog || []).length;

  return (
    <div className="min-h-screen px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white font-quest">Badges</h1>
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
          <span className="text-white/60 text-sm font-quest">
            {earnedCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: totalCount > 0 ? `${(earnedCount / totalCount) * 100}%` : '0%',
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            }}
          />
        </div>
        <div className="text-white/40 text-xs mt-1 text-right">
          {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}% complete
        </div>
      </div>

      {/* Earned section */}
      {earnedCount > 0 && (
        <div className="mb-6">
          <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3 font-quest">
            ✨ Earned
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(catalog || []).filter(b => earnedIds.has(b.id)).map(badge => {
              const earnedDate = (earned || []).find(e => e.id === badge.id)?.earned_at;
              return (
                <div
                  key={badge.id}
                  className="flex flex-col items-center text-center p-4 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.08) 100%)',
                    border: '1px solid rgba(251,191,36,0.3)',
                  }}
                >
                  <span className="text-4xl mb-2">{badge.icon_emoji}</span>
                  <span className="text-white font-bold text-sm font-quest leading-tight">{badge.name}</span>
                  <span className="text-white/50 text-xs mt-1 leading-tight">{badge.description}</span>
                  {earnedDate && (
                    <span className="text-yellow-400/50 text-xs mt-2">
                      {new Date(earnedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked section */}
      {earnedCount < totalCount && (
        <div>
          <h2 className="text-white/30 text-xs font-bold uppercase tracking-widest mb-3 font-quest">
            🔒 Locked
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(catalog || []).filter(b => !earnedIds.has(b.id)).map(badge => (
              <div
                key={badge.id}
                className="flex flex-col items-center text-center p-4 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span className="text-4xl mb-2 grayscale opacity-30">{badge.icon_emoji}</span>
                <span className="text-white/30 font-bold text-sm font-quest leading-tight">{badge.name}</span>
                <span className="text-white/20 text-xs mt-1 leading-tight">{badge.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All earned! */}
      {earnedCount === totalCount && totalCount > 0 && (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🏆</div>
          <div className="text-yellow-300 font-black font-quest text-xl">All badges earned!</div>
          <div className="text-white/50 text-sm mt-1">You're a true champion!</div>
        </div>
      )}
    </div>
  );
}
