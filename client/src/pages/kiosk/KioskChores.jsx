import React, { useState, useRef, useEffect } from 'react';
import { chores as choresApi, ai as aiApi, uploadProof } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ChoreCard from '../../components/kiosk/ChoreCard.jsx';
import { QuestModal } from '../../components/ui/Modal.jsx';
import { QuestLoadingScreen } from '../../components/ui/Spinner.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

const TABS = [
  { key: 'mine',      label: 'My Quests',   emoji: '⚔️' },
  { key: 'open',      label: 'Open Quests', emoji: '🌐' },
  { key: 'completed', label: 'Done',        emoji: '✅' },
];

export default function KioskChores() {
  const toast = useToast();
  const { child, updateChild } = useAuth();
  const [tab, setTab] = useState('mine');
  const [submitChore, setSubmitChore] = useState(null); // chore_instance being submitted
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [joinConfirm, setJoinConfirm] = useState(null); // chore to join
  const [narratives, setNarratives] = useState({});
  const fileRef = useRef();

  const { data: mine,      loading: loadMine,      refetch: refetchMine }      = useApi(() => choresApi.myInstances(),   []);
  const { data: open,      loading: loadOpen,      refetch: refetchOpen }      = useApi(() => choresApi.openInstances(), []);
  const { data: completed, loading: loadCompleted, refetch: refetchCompleted } = useApi(() => choresApi.completed(), []);

  const refetchAll = () => { refetchMine(); refetchOpen(); refetchCompleted(); };

  // Fetch AI narratives for visible chores
  useEffect(() => {
    const allChores = [...(mine || []), ...(open || [])];
    const ids = [...new Set(allChores.map(c => c.chore_id || c.id).filter(Boolean))];
    if (ids.length === 0) return;
    aiApi.narratives(ids)
      .then(res => setNarratives(res.narratives || {}))
      .catch(() => {}); // Silently fail — narratives are optional
  }, [mine, open]);

  const handleClaim = async (instanceId) => {
    try {
      await choresApi.claim(instanceId);
      toast.success('Quest claimed!');
      refetchAll();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleJoin = async (instanceId) => {
    try {
      await choresApi.join(instanceId);
      toast.success('Joined quest!');
      setJoinConfirm(null);
      refetchAll();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenSubmit = (chore) => {
    setSubmitChore(chore);
    setNote('');
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!submitChore) return;
    setSubmitting(true);
    try {
      let proof_photo_url = null;
      if (photo) {
        const res = await uploadProof(photo);
        proof_photo_url = res.url;
      }
      await choresApi.submit(submitChore.chore_id || submitChore.id, { notes: note, proof_photo_url });
      toast.success('Quest submitted! Waiting for approval.');
      setSubmitChore(null);
      refetchAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const loading = tab === 'mine' ? loadMine : tab === 'open' ? loadOpen : loadCompleted;
  const items   = tab === 'mine' ? (mine || []) : tab === 'open' ? (open || []) : (completed || []);

  return (
    <div className="min-h-screen px-6 pt-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black text-white font-quest text-center mb-5">Quest Board</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-white/5 rounded-2xl p-1 max-w-lg mx-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-white/20 text-white shadow'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <span>{t.emoji}</span>
            <span className="font-quest">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <QuestLoadingScreen />
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <div className="text-5xl mb-3">
            {tab === 'mine' ? '⚔️' : tab === 'open' ? '🌐' : '✅'}
          </div>
          <p className="font-quest">
            {tab === 'mine'      ? 'No quests assigned yet' :
             tab === 'open'      ? 'No open quests available' :
             'No completed quests today'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
          {items.map(chore => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              narrative={narratives[chore.chore_id || chore.id]}
              onClaim={tab === 'open' ? () => handleClaim(chore.id) : undefined}
              onJoin={chore.do_together && tab === 'open' ? () => setJoinConfirm(chore) : undefined}
              onSubmit={
                (tab === 'mine' && (chore.status === 'available' || chore.status === 'claimed'))
                  ? () => handleOpenSubmit(chore)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Submit modal */}
      <QuestModal
        open={!!submitChore}
        onClose={() => setSubmitChore(null)}
        title={submitChore ? `Submit: ${submitChore.chore_title || submitChore.title}` : ''}
      >
        {submitChore && (
          <div className="space-y-4">
            <div className="text-center text-white/60 text-sm">
              🪙 +{submitChore.coin_reward} &nbsp;·&nbsp; ⭐ +{submitChore.xp_reward} XP
            </div>

            {submitChore.require_photo && (
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  📷 Photo proof required *
                </label>
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="proof" className="w-full rounded-xl object-cover max-h-48" />
                    <button
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-8 rounded-xl border-2 border-dashed border-white/20 text-white/40 hover:border-white/40 transition-colors text-sm"
                  >
                    📷 Tap to take a photo
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment"
                  className="hidden" onChange={handlePhotoChange} />
              </div>
            )}

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Note (optional)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-yellow-400/40"
                placeholder="Tell your parent what you did…"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || (submitChore.require_photo && !photo)}
              className="w-full py-3.5 rounded-2xl font-black text-black font-quest text-lg transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              {submitting ? 'Submitting…' : '⚔️ Submit Quest!'}
            </button>
            <button
              onClick={() => setSubmitChore(null)}
              className="w-full py-2.5 text-white/40 text-sm hover:text-white/60"
            >
              Cancel
            </button>
          </div>
        )}
      </QuestModal>

      {/* Join confirm modal */}
      <QuestModal
        open={!!joinConfirm}
        onClose={() => setJoinConfirm(null)}
        title="Join Quest Together?"
      >
        {joinConfirm && (
          <div className="space-y-4 text-center">
            <div className="text-white/70 text-sm">
              Join <strong className="text-white">{joinConfirm.chore_title}</strong> and earn a bonus multiplier!
            </div>
            <div className="text-yellow-300 font-bold">
              🤝 Do-Together bonus applies
            </div>
            <button
              onClick={() => handleJoin(joinConfirm.id)}
              className="w-full py-3.5 rounded-2xl font-black text-black font-quest text-lg"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              Join! 🤝
            </button>
            <button onClick={() => setJoinConfirm(null)} className="text-white/40 text-sm">
              Cancel
            </button>
          </div>
        )}
      </QuestModal>
    </div>
  );
}
