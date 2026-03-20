import React, { useState, useEffect } from 'react';
import { chores as choresApi, completions, shop as shopApi } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { QuestLoadingScreen } from '../../components/ui/Spinner.jsx';
import { QuestModal } from '../../components/ui/Modal.jsx';

export default function ParentDashboard() {
  const toast = useToast();
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  const { data: pendingChores, loading: loadingChores, refetch: refetchChores } = useApi(() => choresApi.pending(), []);
  const { data: pendingRedemptions, loading: loadingRedemptions, refetch: refetchRedemptions } = useApi(() => shopApi.listRedemptions(), []);

  const handleApprove = async (submissionId, coins, xp) => {
    setApproving(submissionId);
    try {
      await completions.approve(submissionId, { coins, xp });
      toast.success('Submission approved!');
      refetchChores();
      setApproving(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async (submissionId) => {
    setRejecting(submissionId);
    try {
      await completions.reject(submissionId, {});
      toast.success('Submission rejected');
      refetchChores();
      setRejecting(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFulfill = async (redemptionId) => {
    try {
      await shopApi.fulfill(redemptionId);
      toast.success('Reward fulfilled!');
      refetchRedemptions();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loadingChores && loadingRedemptions) return <QuestLoadingScreen />;

  const pendingSubmissions = pendingChores || [];
  const pending = pendingRedemptions || [];

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Pending Submissions */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white font-quest mb-4">📋 Pending Submissions</h2>
        {pendingSubmissions.length === 0 ? (
          <div className="text-center py-8 text-white/40 rounded-2xl border border-white/10 bg-white/5">
            <div className="text-4xl mb-2">✅</div>
            <p>All caught up! No pending submissions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSubmissions.map(submission => (
              <div
                key={submission.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-white text-lg">{submission.chore_title}</div>
                    <div className="text-white/50 text-sm">{submission.kid_name}</div>
                  </div>
                  <div className="text-right text-sm text-white/60">
                    🪙 +{submission.coin_reward} · ⭐ +{submission.xp_reward}
                  </div>
                </div>

                {submission.note && (
                  <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-white/50 mb-1">Note:</div>
                    <div className="text-white/80 text-sm">{submission.note}</div>
                  </div>
                )}

                {submission.proof_photo_url && (
                  <div className="mb-3">
                    <img
                      src={submission.proof_photo_url}
                      alt="proof"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(submission.id, submission.coin_reward, submission.xp_reward)}
                    disabled={approving === submission.id}
                    className="flex-1 py-2.5 rounded-lg font-bold text-black text-sm transition-all active:scale-95 disabled:opacity-50 bg-green-500 hover:bg-green-600"
                  >
                    {approving === submission.id ? 'Approving...' : '✅ Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(submission.id)}
                    disabled={rejecting === submission.id}
                    className="flex-1 py-2.5 rounded-lg font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 bg-red-600/50 hover:bg-red-600"
                  >
                    {rejecting === submission.id ? 'Rejecting...' : '❌ Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Redemptions */}
      <div>
        <h2 className="text-2xl font-black text-white font-quest mb-4">🎁 Pending Fulfillment</h2>
        {pending.length === 0 ? (
          <div className="text-center py-8 text-white/40 rounded-2xl border border-white/10 bg-white/5">
            <div className="text-4xl mb-2">🎉</div>
            <p>No pending rewards to fulfill.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(redemption => (
              <div
                key={redemption.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-white text-lg">{redemption.item_title}</div>
                    <div className="text-white/50 text-sm">{redemption.kid_name}</div>
                  </div>
                  <div className="text-xl">🎯</div>
                </div>
                <div className="text-white/60 text-sm mb-3">
                  Redeemed for {redemption.coin_cost} coins
                </div>
                <button
                  onClick={() => handleFulfill(redemption.id)}
                  className="w-full py-2.5 rounded-lg font-bold text-black text-sm bg-yellow-400 hover:bg-yellow-500 transition-all active:scale-95"
                >
                  ✓ Mark as Fulfilled
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
