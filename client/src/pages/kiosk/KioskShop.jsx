import React, { useState } from 'react';
import { shop as shopApi } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ShopItemCard from '../../components/kiosk/ShopItemCard.jsx';
import { QuestModal } from '../../components/ui/Modal.jsx';
import { QuestLoadingScreen } from '../../components/ui/Spinner.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { categoryLabel } from '../../utils/formatters.js';

const TABS = [
  { key: 'browse',  label: 'Browse', emoji: '🛒' },
  { key: 'history', label: 'My Purchases', emoji: '📜' },
];

const CATEGORY_ORDER = ['physical', 'privilege', 'experience'];
const STATUS_COLORS = {
  pending:   'text-yellow-400',
  fulfilled: 'text-green-400',
  cancelled: 'text-red-400',
};
const STATUS_LABELS = {
  pending:   '⏳ Pending',
  fulfilled: '✅ Fulfilled',
  cancelled: '❌ Cancelled',
};

export default function KioskShop() {
  const toast = useToast();
  const { child, updateChild, settings } = useAuth();
  const [tab, setTab] = useState('browse');
  const [confirmItem, setConfirmItem] = useState(null);
  const [buying, setBuying] = useState(false);

  const { data: items,    loading: loadItems,   refetch: refetchItems   } = useApi(() => shopApi.list(),          []);
  const { data: history,  loading: loadHistory, refetch: refetchHistory } = useApi(() => shopApi.myRedemptions(), []);

  const coinLabel = settings?.coin_label || 'Gold Coins';

  const handleRedeem = async () => {
    if (!confirmItem || !child) return;
    setBuying(true);
    try {
      await shopApi.redeem(confirmItem.id);
      updateChild({ coins: child.coins - confirmItem.coin_cost });
      toast.success(`Redeemed: ${confirmItem.title}!`);
      setConfirmItem(null);
      refetchItems();
      refetchHistory();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBuying(false);
    }
  };

  const byCategory = CATEGORY_ORDER.map(cat => ({
    cat,
    items: (items || []).filter(i => i.category === cat && i.is_active),
  })).filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Header with coin balance */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-black text-white font-quest">Shop</h1>
        <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-full">
          <span className="text-lg">🪙</span>
          <span className="text-yellow-300 font-bold text-lg font-quest">{child?.coins ?? 0}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-white/5 rounded-2xl p-1">
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

      {/* Browse tab */}
      {tab === 'browse' && (
        loadItems ? <QuestLoadingScreen /> : (
          <div className="space-y-6 pb-4">
            {byCategory.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <div className="text-5xl mb-3">🛍️</div>
                <p className="font-quest">No items in the shop yet</p>
              </div>
            ) : byCategory.map(({ cat, items: catItems }) => (
              <div key={cat}>
                <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2 font-quest">
                  {categoryLabel(cat)}
                </h2>
                <div className="space-y-2">
                  {catItems.map(item => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      myCoins={child?.coins ?? 0}
                      onRedeem={() => setConfirmItem(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* History tab */}
      {tab === 'history' && (
        loadHistory ? <QuestLoadingScreen /> : (
          <div className="space-y-3 pb-4">
            {!history || history.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <div className="text-5xl mb-3">📜</div>
                <p className="font-quest">No purchases yet</p>
              </div>
            ) : history.map(r => (
              <div
                key={r.id}
                className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-3xl">{r.item_emoji}</span>
                <div className="flex-1">
                  <div className="text-white font-bold font-quest">{r.item_title}</div>
                  <div className={`text-sm font-medium mt-0.5 ${STATUS_COLORS[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </div>
                  {r.parent_note && (
                    <div className="text-white/40 text-xs mt-1 italic">"{r.parent_note}"</div>
                  )}
                </div>
                <div className="text-yellow-300 font-bold text-sm">🪙 {r.coins_spent}</div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Confirm redeem modal */}
      <QuestModal
        open={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        title="Redeem Reward?"
      >
        {confirmItem && (
          <div className="space-y-4 text-center">
            <div className="text-7xl">{confirmItem.icon_emoji}</div>
            <div className="text-xl font-bold text-white">{confirmItem.title}</div>
            {confirmItem.description && (
              <div className="text-white/60 text-sm">{confirmItem.description}</div>
            )}
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-white/60 text-sm">Your coins:</span>
              <span className="text-yellow-300 font-bold">🪙 {child?.coins}</span>
              <span className="text-white/30">→</span>
              <span className="text-yellow-300 font-bold">🪙 {(child?.coins ?? 0) - confirmItem.coin_cost}</span>
            </div>
            <div className="text-white/60 text-sm">
              Costs <strong className="text-yellow-300">🪙 {confirmItem.coin_cost}</strong> {coinLabel}
            </div>
            <button
              onClick={handleRedeem}
              disabled={buying || (child?.coins ?? 0) < confirmItem.coin_cost}
              className="w-full py-3.5 rounded-2xl font-black text-black font-quest text-lg disabled:opacity-40 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              {buying ? 'Redeeming…' : '🛒 Redeem!'}
            </button>
            <button onClick={() => setConfirmItem(null)} className="text-white/40 text-sm">
              Cancel
            </button>
          </div>
        )}
      </QuestModal>
    </div>
  );
}
