import React from 'react';

export function QuestModal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-sm rounded-3xl p-6 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white font-quest">{title}</h2>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/60 transition-colors text-xl font-bold"
            >
              ✕
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white/60 transition-colors text-xl font-bold"
          >
            ✕
          </button>
        )}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
