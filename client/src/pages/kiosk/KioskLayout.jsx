import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const NAV_ITEMS = [
  { path: '/kiosk/dashboard', label: 'Home', emoji: '🏠' },
  { path: '/kiosk/chores', label: 'Quests', emoji: '⚔️' },
  { path: '/kiosk/shop', label: 'Shop', emoji: '🛒' },
  { path: '/kiosk/badges', label: 'Badges', emoji: '🏅' },
];

export default function KioskLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { childLogout } = useAuth();

  const handleSwitchKid = async () => {
    await childLogout();
    navigate('/kiosk', { replace: true });
  };

  return (
    <div
      className="min-h-screen flex flex-col pb-20"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      {/* Main content */}
      <div className="flex-1 overflow-y-auto kiosk-root">
        {children}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 px-2 py-3 grid grid-cols-5 gap-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1.5 py-2 rounded-lg transition-all ${
                isActive
                  ? 'text-white bg-white/10'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="font-quest text-xs leading-tight font-bold">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleSwitchKid}
          className="flex flex-col items-center gap-1.5 py-2 rounded-lg text-white/40 hover:text-white/60 transition-all"
        >
          <span className="text-2xl">🔄</span>
          <span className="font-quest text-xs leading-tight font-bold">Switch</span>
        </button>
      </nav>
    </div>
  );
}
