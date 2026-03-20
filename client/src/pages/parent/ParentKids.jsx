import React, { useState } from 'react';
import { kids as kidsApi } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { QuestLoadingScreen } from '../../components/ui/Spinner.jsx';

const AVATAR_EMOJIS = ['🧒', '👦', '👧', '🤴', '👸', '🧑', '👨', '👩', '🐻', '🐼', '🐨', '🦁', '🐯', '🦊', '🐶', '🐱'];

export default function ParentKids() {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('🧒');
  const [editPin, setEditPin] = useState('');

  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('🧒');
  const [newPin, setNewPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: kids, loading, refetch } = useApi(() => kidsApi.list(), []);

  const handleAddKid = async () => {
    if (!newName || !newPin || newPin.length !== 4) {
      toast.error('Name required, PIN must be 4 digits');
      return;
    }

    setSubmitting(true);
    try {
      await kidsApi.create({
        name: newName,
        avatar_emoji: newAvatar,
        pin: newPin,
      });
      toast.success('Kid added!');
      setNewName('');
      setNewAvatar('🧒');
      setNewPin('');
      setShowForm(false);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateKid = async (kidId) => {
    setSubmitting(true);
    try {
      await kidsApi.update(kidId, {
        name: editName,
        avatar_emoji: editAvatar,
        pin: editPin,
      });
      toast.success('Kid updated!');
      setEditingId(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (kidId) => {
    try {
      await kidsApi.toggle(kidId);
      toast.success('Kid status updated');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const startEdit = (kid) => {
    setEditingId(kid.id);
    setEditName(kid.name);
    setEditAvatar(kid.avatar_emoji);
    setEditPin('');
  };

  if (loading) return <QuestLoadingScreen />;

  const kidList = kids || [];

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white font-quest">👨‍👩‍👧‍👦 Kids</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-all"
          >
            + Add Kid
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Add New Kid</h3>

          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Kid's name"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
            disabled={submitting}
          />

          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">Avatar</label>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setNewAvatar(emoji)}
                  className={`py-3 rounded-lg text-2xl transition-all ${
                    newAvatar === emoji
                      ? 'bg-yellow-400/50 border-2 border-yellow-400'
                      : 'bg-white/10 border border-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4-digit PIN"
            maxLength="4"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
            disabled={submitting}
          />

          <div className="flex gap-2">
            <button
              onClick={handleAddKid}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition-all disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Create Kid'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Kids list */}
      {kidList.length === 0 ? (
        <div className="text-center py-12 text-white/40 rounded-2xl border border-white/10 bg-white/5">
          <div className="text-5xl mb-3">👶</div>
          <p className="mb-6">No kids yet. Add one to get started!</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition-all"
            >
              + Add Your First Kid
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {kidList.map(kid => (
            <div key={kid.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
              {editingId === kid.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40"
                  />

                  <div>
                    <label className="block text-white/70 text-xs font-medium mb-2">Avatar</label>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATAR_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => setEditAvatar(emoji)}
                          className={`py-2 rounded text-xl transition-all ${
                            editAvatar === emoji
                              ? 'bg-yellow-400/50 border-2 border-yellow-400'
                              : 'bg-white/10 border border-white/10'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="New PIN (leave blank to keep current)"
                    maxLength="4"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateKid(kid.id)}
                      disabled={submitting}
                      className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{kid.avatar_emoji}</span>
                      <div>
                        <div className="font-bold text-white text-lg">{kid.name}</div>
                        <div className="text-white/50 text-sm">Level {kid.level}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-bold">🪙 {kid.coins}</div>
                      <div className="text-purple-400 text-sm">⭐ {kid.xp} XP</div>
                    </div>
                  </div>

                  {kid.streak > 0 && (
                    <div className="text-white/60 text-sm mb-3">🔥 {kid.streak} day streak</div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(kid)}
                      className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(kid.id)}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                        kid.is_active
                          ? 'bg-green-600/50 hover:bg-green-600/70 text-white'
                          : 'bg-gray-600/50 hover:bg-gray-600/70 text-white/60'
                      }`}
                    >
                      {kid.is_active ? '✓ Active' : '⊘ Inactive'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
