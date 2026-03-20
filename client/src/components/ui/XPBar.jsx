import React from 'react';
import { xpProgress } from '../../utils/levelCalc.js';

export default function XPBar({ xp, showLabel = true, height = 'h-3', className = '' }) {
  const { level, current, needed, pct } = xpProgress(xp || 0);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-white/70 mb-1 font-medium">
          <span>Level {level}</span>
          <span>{current} / {needed} XP</span>
        </div>
      )}
      <div className={`w-full bg-white/10 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} bg-gradient-to-r from-purple-400 to-blue-500 rounded-full xp-bar-fill`}
          style={{ width: `${Math.max(2, pct * 100)}%` }}
        />
      </div>
    </div>
  );
}
