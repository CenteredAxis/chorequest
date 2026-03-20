import React, { useState } from 'react';
import { chores as choresApi, kids as kidsApi } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { QuestLoadingScreen } from '../../components/ui/Spinner.jsx';

export default function ParentChores() {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coinReward, setCoinReward] = useState('');
  const [xpReward, setXpReward] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [cronSchedule, setCronSchedule] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [assignedKids, setAssignedKids] = useState([]);
  const [doTogether, setDoTogether] = useState(false);
  const [requirePhoto, setRequirePhoto] = useState(false);

  const { data: chores, loading: loadingChores, refetch: refetchChores } = useApi(() => choresApi.list(), []);
  const { data: kids, loading: loadingKids } = useApi(() => kidsApi.list(), []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCoinReward('');
    setXpReward('');
    setIsRecurring(false);
    setCronSchedule('');
    setIsOpen(true);
    setAssignedKids([]);
    setDoTogether(false);
    setRequirePhoto(false);
    setEditingId(null);
  };

  const handleAddChore = async () => {
    if (!title || !coinReward || !xpReward) {
      toast.error('Title, coins, and XP required');
      return;
    }

    setSubmitting(true);
    try {
      await choresApi.create({
        title,
        description,
        coin_reward: parseInt(coinReward),
        xp_reward: parseInt(xpReward),
        is_recurring: isRecurring,
        cron_schedule: isRecurring ? cronSchedule : null,
        is_open: isOpen,
        assigned_kid_ids: assignedKids,
        do_together: doTogether,
        requires_proof: requirePhoto,
      });
      toast.success('Chore created!');
      resetForm();
      setShowForm(false);
      refetchChores();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChore = async (choreId) => {
    if (!window.confirm('Delete this chore?')) return;
    try {
      await choresApi.delete(choreId);
      toast.success('Chore deleted');
      refetchChores();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loadingChores && loadingKids) return <QuestLoadingScreen />;

  const choreList = chores || [];
  const kidList = kids || [];

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white font-quest">⚔️ Chores</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-all"
          >
            + Add Chore
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Add New Chore</h3>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chore title"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
            disabled={submitting}
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40 resize-none"
            disabled={submitting}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={coinReward}
              onChange={(e) => setCoinReward(e.target.value)}
              placeholder="Coin reward"
              min="0"
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
              disabled={submitting}
            />
            <input
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(e.target.value)}
              placeholder="XP reward"
              min="0"
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
              disabled={submitting}
            />
          </div>

          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={requirePhoto}
              onChange={(e) => setRequirePhoto(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Requires photo proof</span>
          </label>

          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Recurring</span>
          </label>

          {isRecurring && (
            <input
              type="text"
              value={cronSchedule}
              onChange={(e) => setCronSchedule(e.target.value)}
              placeholder="Cron schedule (e.g., 0 8 * * *)"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40 text-sm"
              disabled={submitting}
            />
          )}

          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={isOpen}
              onChange={(e) => setIsOpen(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Open to all kids</span>
          </label>

          {!isOpen && (
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Assign to kids</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {kidList.map(kid => (
                  <label key={kid.id} className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedKids.includes(kid.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedKids([...assignedKids, kid.id]);
                        } else {
                          setAssignedKids(assignedKids.filter(id => id !== kid.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span>{kid.avatar_emoji} {kid.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={doTogether}
              onChange={(e) => setDoTogether(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Do-together eligible (kids can join)</span>
          </label>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAddChore}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition-all disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Chore'}
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chores list */}
      {choreList.length === 0 ? (
        <div className="text-center py-12 text-white/40 rounded-2xl border border-white/10 bg-white/5">
          <div className="text-5xl mb-3">📋</div>
          <p className="mb-6">No chores yet. Create one!</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition-all"
            >
              + Create First Chore
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {choreList.map(chore => (
            <div key={chore.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-bold text-white text-lg">{chore.title}</div>
                  {chore.description && (
                    <div className="text-white/60 text-sm">{chore.description}</div>
                  )}
                </div>
                <div className="text-right text-sm text-white/60">
                  🪙 {chore.coin_reward} · ⭐ {chore.xp_reward}
                </div>
              </div>

              <div className="flex gap-2 text-xs text-white/50 mb-3 flex-wrap">
                {chore.is_recurring && <span className="px-2 py-1 rounded-full bg-white/10">🔄 Recurring</span>}
                {chore.is_open && <span className="px-2 py-1 rounded-full bg-white/10">🌐 Open</span>}
                {chore.do_together && <span className="px-2 py-1 rounded-full bg-white/10">🤝 Do-Together</span>}
                {chore.requires_proof && <span className="px-2 py-1 rounded-full bg-white/10">📷 Proof</span>}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteChore(chore.id)}
                  className="flex-1 py-2 rounded-lg bg-red-600/50 hover:bg-red-600 text-white font-bold text-sm transition-all"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
