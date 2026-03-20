import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kids as kidsApi } from '../../api/client.js';
import PinPad from '../../components/kiosk/PinPad.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { QuestLoadingScreen } from '../../components/ui/Spinner.jsx';

export default function KioskAvatarSelect() {
  const navigate = useNavigate();
  const { childLogin, status } = useAuth();
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKid, setSelectedKid] = useState(null);
  const [pinError, setPinError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in as child, go straight to dashboard
  useEffect(() => {
    if (status === 'child') navigate('/kiosk/dashboard', { replace: true });
  }, [status, navigate]);

  useEffect(() => {
    kidsApi.listAll()
      .then(setKids)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div
      className="kiosk-root min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-7xl mb-3 animate-bounce-in">🏆</div>
        <h1 className="text-4xl font-bold text-white font-quest tracking-wide">ChoreQuest</h1>
        <p className="text-white/50 mt-2 text-lg">Who's playing today?</p>
      </div>

      {/* Avatar grid or PIN pad */}
      {!selectedKid ? (
        <div className="w-full max-w-sm">
          {kids.length === 0 ? (
            <div className="text-center text-white/40 py-12">
              <div className="text-5xl mb-3">😴</div>
              <p>No adventurers yet.<br />Ask a parent to add kids!</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${kids.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {kids.map(kid => (
                <button
                  key={kid.id}
                  onClick={() => handleSelectKid(kid)}
                  className="flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-150 touch-none select-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="text-6xl">{kid.avatar_emoji}</span>
                  <span className="text-white font-bold text-xl font-quest">{kid.name}</span>
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <span>🪙 {kid.coins}</span>
                    <span>Lv.{kid.level}</span>
                    <span>🔥{kid.streak}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-xs">
          <PinPad
            kidName={selectedKid.name}
            kidEmoji={selectedKid.avatar_emoji}
            onSubmit={handlePin}
            onCancel={() => { setSelectedKid(null); setPinError(''); }}
            error={pinError}
          />
        </div>
      )}

      {/* Footer hint */}
      <p className="mt-12 text-white/20 text-sm">
        Parents:{' '}
        <a href="/login" className="underline hover:text-white/40 transition-colors">
          Admin panel
        </a>
      </p>
    </div>
  );
}
