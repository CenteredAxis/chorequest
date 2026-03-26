import React, { useState, useEffect } from 'react';
import { settings as settingsApi } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function ParentSettings() {
  const toast = useToast();
  const { settings, updateSettings } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const [householdName, setHouseholdName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [coinLabel, setCoinLabel] = useState('');
  const [screensaverTimeout, setScreensaverTimeout] = useState('');
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [maxDailyQuests, setMaxDailyQuests] = useState(3);

  useEffect(() => {
    if (settings) {
      setHouseholdName(settings.household_name || '');
      setTimezone(settings.timezone || '');
      setCoinLabel(settings.coin_label || 'Gold Coins');
      setScreensaverTimeout(settings.screensaver_timeout || '300');
      setSoundsEnabled(settings.sounds_enabled !== false);
      setMaxDailyQuests(settings.max_daily_quests || 3);
    }
  }, [settings]);

  const handleSave = async () => {
    setSubmitting(true);
    setSaved(false);

    try {
      const data = {
        household_name: householdName,
        timezone,
        coin_label: coinLabel,
        screensaver_timeout: parseInt(screensaverTimeout),
        sounds_enabled: soundsEnabled,
        max_daily_quests: parseInt(maxDailyQuests),
      };

      await settingsApi.update(data);
      updateSettings(data);
      toast.success('Settings saved!');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl">
      <h2 className="text-2xl font-black text-white font-quest mb-6">⚙️ Settings</h2>

      <div className="space-y-6">
        {/* Household */}
        <div>
          <label className="block text-white/70 text-sm font-medium mb-2">Household Name</label>
          <input
            type="text"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            placeholder="The Smith Family"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-white/70 text-sm font-medium mb-2">Timezone</label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="America/Los_Angeles"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
          />
          <p className="text-white/40 text-xs mt-1">E.g., America/Los_Angeles, Europe/London, etc.</p>
        </div>

        {/* Coin label */}
        <div>
          <label className="block text-white/70 text-sm font-medium mb-2">Coin Label</label>
          <input
            type="text"
            value={coinLabel}
            onChange={(e) => setCoinLabel(e.target.value)}
            placeholder="Gold Coins"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
          />
          <p className="text-white/40 text-xs mt-1">What to call your currency (e.g., Gold Coins, Stars, Points)</p>
        </div>

        {/* Screensaver timeout */}
        <div>
          <label className="block text-white/70 text-sm font-medium mb-2">Screensaver Timeout (seconds)</label>
          <input
            type="number"
            value={screensaverTimeout}
            onChange={(e) => setScreensaverTimeout(e.target.value)}
            placeholder="300"
            min="30"
            max="3600"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
          />
          <p className="text-white/40 text-xs mt-1">Time before kiosk returns to avatar select screen (30-3600 seconds)</p>
        </div>

        {/* Daily Quest Limit */}
        <div>
          <label className="block text-white/70 text-sm font-medium mb-2">Daily Quest Limit</label>
          <input
            type="number"
            value={maxDailyQuests}
            onChange={(e) => setMaxDailyQuests(e.target.value)}
            placeholder="3"
            min="1"
            max="10"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
          />
          <p className="text-white/40 text-xs mt-1">How many quests each child sees per day (1-10). A bonus quest unlocks after completing them all!</p>
        </div>

        {/* Sounds */}
        <label className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
          <input
            type="checkbox"
            checked={soundsEnabled}
            onChange={(e) => setSoundsEnabled(e.target.checked)}
            className="w-5 h-5"
          />
          <div>
            <div className="text-white font-medium">Enable Sound Effects</div>
            <div className="text-white/50 text-sm">Play sounds for completions, approvals, and rewards</div>
          </div>
        </label>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="flex-1 py-3 rounded-2xl font-black text-black font-quest text-lg transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
        >
          {submitting ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>

      {saved && (
        <div className="mt-4 p-3 rounded-lg bg-green-600/20 border border-green-600/50 text-green-200 text-sm text-center font-medium">
          ✓ Settings saved successfully!
        </div>
      )}
    </div>
  );
}
