import React, { useState } from 'react';
import { shop as shopApi } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { QuestLoadingScreen } from '../../components/ui/Spinner.jsx';

const CATEGORIES = ['Physical', 'Privilege', 'Experience'];

export default function ParentShop() {
  const toast = useToast();
  const [tab, setTab] = useState('items');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coinCost, setCoinCost] = useState('');
  const [category, setCategory] = useState('Physical');

  const { data: items, loading: loadingItems, refetch: refetchItems } = useApi(() => shopApi.listItems(), []);
  const { data: redemptions, loading: loadingRedemptions, refetch: refetchRedemptions } = useApi(() => shopApi.listRedemptions(), []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCoinCost('');
    setCategory('Physical');
    setShowForm(false);
  };

  const handleAddItem = async () => {
    if (!title || !coinCost) {
      toast.error('Title and cost required');
      return;
    }

    setSubmitting(true);
    try {
      await shopApi.createItem({
        title,
        description,
        coin_cost: parseInt(coinCost),
        category,
      });
      toast.success('Item added!');
      resetForm();
      refetchItems();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await shopApi.deleteItem(itemId);
      toast.success('Item deleted');
      refetchItems();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFulfill = async (redemptionId) => {
    try {
      await shopApi.fulfill(redemptionId);
      toast.success('Fulfilled!');
      refetchRedemptions();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if ((tab === 'items' && loadingItems) || (tab === 'pending' && loadingRedemptions)) {
    return <QuestLoadingScreen />;
  }

  const itemList = items || [];
  const redemptionList = redemptions?.filter(r => !r.fulfilled_at) || [];
  const categoryItems = itemList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white font-quest">🛒 Shop</h2>
        {tab === 'items' && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-all"
          >
            + Add Item
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white/5 rounded-xl p-1">
        <button
          onClick={() => setTab('items')}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
            tab === 'items'
              ? 'bg-white/20 text-white'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          📦 Items
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
            tab === 'pending'
              ? 'bg-white/20 text-white'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          ⏳ Pending ({redemptionList.length})
        </button>
      </div>

      {/* Items tab */}
      {tab === 'items' && (
        <>
          {showForm && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Add New Item</h3>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Item title"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
                disabled={submitting}
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={2}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40 resize-none"
                disabled={submitting}
              />

              <input
                type="number"
                value={coinCost}
                onChange={(e) => setCoinCost(e.target.value)}
                placeholder="Coin cost"
                min="0"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
                disabled={submitting}
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-400/40"
                disabled={submitting}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddItem}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Create Item'}
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {itemList.length === 0 ? (
            <div className="text-center py-12 text-white/40 rounded-2xl border border-white/10 bg-white/5">
              <div className="text-5xl mb-3">📦</div>
              <p className="mb-6">No items yet. Create some!</p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition-all"
                >
                  + Add First Item
                </button>
              )}
            </div>
          ) : (
            CATEGORIES.map(cat => {
              const catItems = categoryItems[cat] || [];
              if (catItems.length === 0) return null;
              return (
                <div key={cat} className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-3">{cat}</h3>
                  <div className="space-y-3">
                    {catItems.map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-bold text-white text-lg">{item.title}</div>
                            {item.description && (
                              <div className="text-white/60 text-sm">{item.description}</div>
                            )}
                          </div>
                          <div className="text-lg font-black text-yellow-400">🪙 {item.coin_cost}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-full py-2 rounded-lg bg-red-600/50 hover:bg-red-600 text-white font-bold text-sm transition-all"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      {/* Pending tab */}
      {tab === 'pending' && (
        <>
          {redemptionList.length === 0 ? (
            <div className="text-center py-12 text-white/40 rounded-2xl border border-white/10 bg-white/5">
              <div className="text-5xl mb-3">✅</div>
              <p>No pending fulfillments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {redemptionList.map(redemption => (
                <div
                  key={redemption.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-white text-lg">{redemption.item_title}</div>
                      <div className="text-white/50 text-sm">{redemption.kid_name}</div>
                    </div>
                    <div className="text-yellow-400 font-bold">🪙 {redemption.coin_cost}</div>
                  </div>
                  <button
                    onClick={() => handleFulfill(redemption.id)}
                    className="w-full py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition-all"
                  >
                    ✓ Mark Fulfilled
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
