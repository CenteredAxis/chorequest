import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kids as kidsApi } from '../../api/client.js';
import PinPad from '../../components/kiosk/PinPad.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { QuestLoadingScreen } from '../../components/ui/Spinner.jsx';

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning! Ready for today\'s quests?';
  if (h >= 12 && h < 17) return 'Good afternoon! Time to quest!';
  if (h >= 17 && h < 21) return 'Good evening! Any quests left?';
  return 'Who\'s playing today?';
}

export default function KioskAvatarSelect() {
  const navigate = useNavigate();
  const { childLogin, status } = useAuth();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedKid, setSelectedKid] = useState(null);
  const [pinError, setPinError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'child') navigate('/kiosk/dashboard', { replace: true });
  }, [status, navigate]);

  const fetchBoard = useCallback(() => {
    kidsApi.kioskBoard()
      .then(setBoard)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchBoard, 30000);
    return () => clearInterval(id);
  }, [fetchBoard]);

  const handleSelectKid = (kid) => {
    setPinError('');
    setSelectedKid(kid);
  };

  const handlePin = useCallback(async (pin) => {
    if (submitting) return;
    setSubmitting(true);
    setPinError('');
    try {
      await childLogin(selectedKid.id, pin);
      navigate('/kiosk/dashboard', { replace: true });
    } catch {
      setPinError('Wrong PIN, try again!');
    } finally {
      setSubmitting(false);
    }
  }, [selectedKid, childLogin, navigate, submitting]);

  if (loading || status === 'loading') return <QuestLoadingScreen />;

  const kids = board?.kids || [];
  const openChores = board?.open_chores || [];

  return (
    <div
      className="kiosk-root min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      {/* Header */}
      <div className="text-center pt-8 pb-6 px-6">
        <div className="text-6xl mb-2 animate-float">🏆</div>
        <h1 className="text-4xl font-bold text-white font-quest tracking-wide">ChoreQuest</h1>
        <p className="text-white/50 mt-2 text-lg">{getGreeting()}</p>
      </div>

      {/* Main content area */}
      <div className="flex-1 px-6 pb-6 max-w-7xl mx-auto w-full">

        {/* === PIN PAD VIEW === */}
        {selectedKid ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-full max-w-sm">
              <PinPad
                kidName={selectedKid.name}
                kidEmoji={selectedKid.avatar_emoji}
                onSubmit={handlePin}
                onCancel={() => { setSelectedKid(null); setPinError(''); }}
                error={pinError}
              />
            </div>
          </div>
        ) : (
          <>
            {/* === KID CARDS GRID === */}
            {kids.length === 0 ? (
              <div className="text-center text-white/40 py-16">
                <div className="text-6xl mb-4">😴</div>
                <p className="text-xl">No adventurers yet.</p>
                <p className="text-sm mt-1">Ask a parent to add kids!</p>
              </div>
            ) : (
              <div className={`grid gap-5 mb-8 ${
                kids.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
                kids.length === 2 ? 'grid-cols-2 max-w-2xl mx-auto' :
                'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {kids.map(kid => (
                  <button
                    key={kid.id}
                    onClick={() => handleSelectKid(kid)}
                    className="flex flex-col items-center p-6 rounded-3xl border-2 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 active:scale-[0.97] transition-all duration-200 touch-none select-none text-left"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {/* Avatar + Name */}
                    <span className="text-7xl xl:text-8xl mb-3">{kid.avatar_emoji}</span>
                    <span className="text-white font-bold text-xl xl:text-2xl font-quest">{kid.name}</span>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mt-2 text-sm text-white/60">
                      <span>🪙 {kid.coins}</span>
                      <span>Lv.{kid.level}</span>
                      {kid.streak > 0 && <span>🔥{kid.streak}</span>}
                    </div>

                    {/* Chore preview */}
                    <div className="w-full border-t border-white/10 mt-4 pt-3">
                      {kid.chore_count === 0 ? (
                        <div className="text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 border border-green-400/30 text-green-300 text-xs font-bold">
                            ✅ All done for today!
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">⚔️ Today's Quests</p>
                          {kid.pending_chores.map((chore, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-white/70 text-sm truncate flex-1 mr-2">{chore.title}</span>
                              <span className="text-yellow-400/70 text-xs whitespace-nowrap">🪙 {chore.coin_reward}</span>
                            </div>
                          ))}
                          {kid.chore_count > 3 && (
                            <p className="text-white/30 text-xs">+{kid.chore_count - 3} more quest{kid.chore_count - 3 > 1 ? 's' : ''}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* === OPEN CHORES BAR === */}
            {openChores.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🌐</span>
                  <h2 className="text-white/60 text-sm font-bold uppercase tracking-wider">Open Quests — anyone can claim!</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {openChores.map((chore, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-sm"
                    >
                      <span className="text-white/70">{chore.title}</span>
                      <span className="text-yellow-400/70 text-xs font-bold whitespace-nowrap">🪙 {chore.coin_reward}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-white/20 text-sm">
          Parents:{' '}
          <a href="/login" className="underline hover:text-white/40 transition-colors">
            Admin panel
          </a>
        </p>
      </div>
    </div>
  );
}
