import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const NAV_ITEMS = [
  { path: '/parent/dashboard', label: 'Dashboard', emoji: '📊' },
  { path: '/parent/kids', label: 'Kids', emoji: '👨‍👩‍👧‍👦' },
  { path: '/parent/chores', label: 'Chores', emoji: '⚔️' },
  { path: '/parent/shop', label: 'Shop', emoji: '🛒' },
  { path: '/parent/settings', label: 'Settings', emoji: '⚙️' },
];

export default function ParentLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { parentLogout } = useAuth();

  const handleLogout = async () => {
    await parentLogout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 border-r border-white/10" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="px-5 py-5 border-b border-white/10">
          <h1 className="text-xl font-black text-white font-quest">🏆 ChoreQuest</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white bg-white/10'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="font-quest">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
          >
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main wrapper — offset on desktop for sidebar */}
      <div className="flex-1 flex flex-col lg:ml-56">
        {/* Mobile top bar — hidden on desktop */}
        <div className="lg:hidden sticky top-0 z-40 border-b border-white/10 px-4 py-4 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <h1 className="text-xl font-black text-white font-quest">🏆 ChoreQuest</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation — hidden on desktop */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 px-2 py-2 grid grid-cols-5 gap-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'text-white bg-white/10'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="font-quest text-xs leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
