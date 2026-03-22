import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kids as kidsApi } from '../../api/client.js';
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
  const [pinDigits, setPinDigits] = useState(0);
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
    setPinDigits(0);
    pinRef.current = '';
    setSelectedKid(kid);
  };

  const pinRef = React.useRef('');

  const handleButton = useCallback((val) => {
    if (submitting) return;
    if (val === '⌫') {
      pinRef.current = pinRef.current.slice(0, -1);
      setPinDigits(pinRef.current.length);
      return;
    }
    if (val === '' || pinRef.current.length >= 4) return;

    pinRef.current += val;
    setPinDigits(pinRef.current.length);

    if (pinRef.current.length === 4) {
      const pin = pinRef.current;
      pinRef.current = '';
      setSubmitting(true);
      setPinError('');
      childLogin(selectedKid.id, pin)
        .then(() => navigate('/kiosk/dashboard', { replace: true }))
        .catch(() => {
          setPinError('Wrong PIN, try again!');
          setPinDigits(0);
        })
        .finally(() => setSubmitting(false));
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
      <div className="text-center pt-8 pb-4 px-6">
        <div className="text-6xl mb-2 animate-float">🏆</div>
        <h1 className="text-4xl font-bold text-white font-quest tracking-wide">ChoreQuest</h1>
        <p className="text-white/50 mt-2 text-lg">{getGreeting()}</p>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center px-6 pb-6">

        {/* === PIN PAD VIEW === */}
        {selectedKid ? (
          <div className="flex flex-col items-center justify-center py-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="text-8xl mb-3 animate-bounce-in">{selectedKid.avatar_emoji}</div>
              <p className="text-white font-bold text-3xl font-quest">{selectedKid.name}</p>
              <p className="text-white/50 text-lg mt-2">Enter your PIN</p>
            </div>

            {/* PIN dots */}
            <div className="flex gap-5 mb-8">
              {[0,1,2,3].map(i => {
                const filled = i < (pinDigits ?? 0);
                return (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                      filled
                        ? 'bg-yellow-400 border-yellow-400 scale-110'
                        : 'bg-transparent border-white/30'
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <p className="text-red-400 text-sm font-semibold animate-pulse mb-4">{pinError}</p>
            )}

            {/* Number pad — large for TV */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((btn, i) => (
                <button
                  key={i}
                  onClick={() => handleButton(btn)}
                  disabled={btn === ''}
                  className={`h-20 rounded-2xl text-2xl font-bold transition-all duration-100 active:scale-95 select-none
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

            <button
              onClick={() => { setSelectedKid(null); setPinError(''); setPinDigits(0); }}
              className="text-white/40 hover:text-white/70 text-base transition-colors mt-6"
            >
              ← Back
            </button>
          </div>
        ) : (
          <>
            {/* === KID CARDS === */}
            {kids.length === 0 ? (
              <div className="text-center text-white/40 py-16">
                <div className="text-6xl mb-4">😴</div>
                <p className="text-xl">No adventurers yet.</p>
                <p className="text-sm mt-1">Ask a parent to add kids!</p>
              </div>
            ) : (
              <div className="w-full max-w-5xl">
                <div className={`grid gap-5 mb-8 ${
                  kids.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
                  kids.length === 2 ? 'grid-cols-2 max-w-xl mx-auto' :
                  kids.length === 3 ? 'grid-cols-3 max-w-4xl mx-auto' :
                  'grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto'
                }`}>
                  {kids.map(kid => (
                    <button
                      key={kid.id}
                      onClick={() => handleSelectKid(kid)}
                      className="flex flex-col items-center p-5 rounded-3xl border-2 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 active:scale-[0.97] transition-all duration-200 touch-none select-none"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <span className="text-7xl xl:text-8xl mb-2">{kid.avatar_emoji}</span>
                      <span className="text-white font-bold text-xl font-quest">{kid.name}</span>

                      <div className="flex items-center gap-3 mt-1.5 text-sm text-white/60">
                        <span>🪙 {kid.coins}</span>
                        <span>Lv.{kid.level}</span>
                        {kid.streak > 0 && <span>🔥{kid.streak}</span>}
                      </div>

                      <div className="w-full border-t border-white/10 mt-3 pt-3">
                        {kid.chore_count === 0 ? (
                          <div className="text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 border border-green-400/30 text-green-300 text-xs font-bold">
                              ✅ All done!
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1.5">⚔️ Quests</p>
                            {kid.pending_chores.map((chore, i) => (
                              <div key={i} className="flex items-center justify-between text-left">
                                <span className="text-white/70 text-sm truncate flex-1 mr-2">{chore.title}</span>
                                <span className="text-yellow-400/70 text-xs whitespace-nowrap">🪙{chore.coin_reward}</span>
                              </div>
                            ))}
                            {kid.chore_count > 3 && (
                              <p className="text-white/30 text-xs">+{kid.chore_count - 3} more</p>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* === OPEN QUESTS SECTION === */}
            {openChores.length > 0 && (
              <div className="w-full max-w-5xl">
                <div className="rounded-3xl border-2 border-yellow-400/20 bg-yellow-400/5 p-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <span className="text-3xl">🌐</span>
                    <h2 className="text-white text-xl font-bold font-quest">Open Quests — Anyone Can Claim!</h2>
                  </div>
                  <p className="text-center text-white/40 text-sm mb-5">
                    Log in to claim a quest. First come, first served!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {openChores.map((chore, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-white font-medium text-sm truncate">{chore.title}</p>
                          {chore.do_together === 1 && (
                            <span className="text-purple-300/70 text-xs">🤝 Do-Together</span>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-sm font-bold shrink-0">
                          🪙 {chore.coin_reward}
                        </span>
                      </div>
                    ))}
                  </div>
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
