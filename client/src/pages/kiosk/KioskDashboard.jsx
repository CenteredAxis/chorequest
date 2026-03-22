import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications as notifsApi, chores as choresApi } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useSound } from '../../contexts/SoundContext.jsx';
import XPBar from '../../components/ui/XPBar.jsx';
import ConfettiOverlay from '../../components/ui/ConfettiOverlay.jsx';
import { QuestLoadingScreen } from '../../components/ui/Spinner.jsx';
import { QuestModal } from '../../components/ui/Modal.jsx';
import { usePolling } from '../../hooks/useApi.js';

const POLL_MS = 10_000;

export default function KioskDashboard() {
  const navigate = useNavigate();
  const { child, updateChild, settings } = useAuth();
  const { playSound } = useSound();

  const [confetti, setConfetti] = useState(null);    // { coins, message }
  const [levelModal, setLevelModal] = useState(null); // { level }
  const [badgeModal, setBadgeModal] = useState(null); // { name, icon, description }
  const [pendingCount, setPendingCount] = useState(0);
  const seenIds = useRef(new Set());

  // Poll notifications
  const { data: notifs } = usePolling(() => notifsApi.unread(), POLL_MS, []);

  useEffect(() => {
    if (!notifs) return;
    const unread = notifs.filter(n => !n.is_read && !seenIds.current.has(n.id));
    if (unread.length === 0) return;

    unread.forEach(n => {
      seenIds.current.add(n.id);
      notifsApi.markRead(n.id).catch(() => {});

      const payload = n.payload ? JSON.parse(n.payload) : {};

      if (n.type === 'approved') {
        playSound('coin');
        setConfetti({ coins: payload.coins || 0, message: `+${payload.coins || 0} coins!` });
        // Refresh child stats
        updateChild({ coins: child.coins + (payload.coins || 0), xp: child.xp + (payload.xp || 0) });
        if (payload.level_up) {
          setTimeout(() => setLevelModal({ level: payload.new_level }), 1500);
        }
      } else if (n.type === 'badge') {
        playSound('complete');
        setBadgeModal({ name: payload.badge_name, icon: payload.badge_icon, description: payload.badge_description });
      } else if (n.type === 'level_up') {
        playSound('levelup');
        setLevelModal({ level: payload.new_level });
      }
    });
  }, [notifs]);

  // Count pending submissions for the "Awaiting" pill
  const { data: myChores } = usePolling(() => choresApi.myInstances(), POLL_MS, []);
  useEffect(() => {
    if (myChores) setPendingCount(myChores.filter(c => c.status === 'submitted').length);
  }, [myChores]);

  if (!child) return <QuestLoadingScreen />;

  const coinLabel = settings?.coin_label || 'Gold Coins';

  return (
    <div className="min-h-screen px-4 pt-8 pb-4">
      {/* Hero card */}
      <div className="max-w-sm mx-auto">
        <div
          className="rounded-3xl p-6 text-center mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="text-7xl mb-3 animate-bounce-in">{child.avatar_emoji}</div>
          <h2 className="text-2xl font-bold text-white font-quest mb-1">{child.name}</h2>
          <div className="text-white/50 text-sm mb-4">Level {child.level} Adventurer</div>

          {/* Coins */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl font-black text-yellow-300 font-quest drop-shadow-lg">
              🪙 {child.coins}
            </span>
          </div>
          <div className="text-yellow-300/60 text-xs mb-5">{coinLabel}</div>

          {/* XP Bar */}
          <XPBar xp={child.xp} />

          {/* Streak */}
          {child.streak > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className="text-white font-bold font-quest">
                {child.streak} day streak!
              </span>
            </div>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => navigate('/kiosk/chores')}
            className="relative flex flex-col items-center gap-2 p-5 rounded-2xl font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <span className="text-3xl">⚔️</span>
            <span className="font-quest text-sm">Quests</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/kiosk/shop')}
            className="flex flex-col items-center gap-2 p-5 rounded-2xl font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <span className="text-3xl">🛒</span>
            <span className="font-quest text-sm">Shop</span>
          </button>
          <button
            onClick={() => navigate('/kiosk/badges')}
            className="flex flex-col items-center gap-2 p-5 rounded-2xl font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <span className="text-3xl">🏅</span>
            <span className="font-quest text-sm">Badges</span>
          </button>
        </div>
      </div>

      {/* Celebrations */}
      {confetti && (
        <ConfettiOverlay
          message={confetti.message}
          coins={confetti.coins}
          onComplete={() => setConfetti(null)}
        />
      )}

      {levelModal && (
        <QuestModal open onClose={() => setLevelModal(null)} title="">
          <div className="text-center py-4">
            <div className="text-8xl mb-4 animate-bounce-in">🚀</div>
            <div className="text-3xl font-black text-yellow-300 font-quest mb-2">
              LEVEL UP!
            </div>
            <div className="text-white text-xl mb-1">You reached</div>
            <div className="text-5xl font-black text-white font-quest mb-6">
              Level {levelModal.level}
            </div>
            <button
              onClick={() => setLevelModal(null)}
              className="px-8 py-3 rounded-2xl font-bold text-black font-quest text-lg"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              Awesome! 🎉
            </button>
          </div>
        </QuestModal>
      )}

      {badgeModal && (
        <QuestModal open onClose={() => setBadgeModal(null)} title="">
          <div className="text-center py-4">
            <div className="text-8xl mb-4 animate-bounce-in">{badgeModal.icon}</div>
            <div className="text-2xl font-black text-yellow-300 font-quest mb-2">
              Badge Earned!
            </div>
            <div className="text-white text-xl font-bold mb-2">{badgeModal.name}</div>
            <div className="text-white/60 text-sm mb-6">{badgeModal.description}</div>
            <button
              onClick={() => setBadgeModal(null)}
              className="px-8 py-3 rounded-2xl font-bold text-black font-quest text-lg"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              Sweet! ⭐
            </button>
          </div>
        </QuestModal>
      )}
    </div>
  );
}
