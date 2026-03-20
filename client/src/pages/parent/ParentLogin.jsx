import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function ParentLogin() {
  const navigate = useNavigate();
  const { parentLogin, isParent, isLoading } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isParent) {
      navigate('/parent/dashboard', { replace: true });
    }
  }, [isParent, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      await parentLogin(username, password);
      toast.success('Welcome back, parent!');
      navigate('/parent/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      toast.error('Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🏆</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-7xl mb-3">🏆</div>
          <h1 className="text-4xl font-bold text-white font-quest mb-2">ChoreQuest</h1>
          <p className="text-white/50">Parent Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/40"
              disabled={submitting}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !username || !password}
            className="w-full py-3 rounded-2xl font-bold text-black font-quest text-lg transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          >
            {submitting ? 'Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-center text-white/30 text-xs">
            Kids? Go to the{' '}
            <a href="/kiosk" className="underline hover:text-white/50 transition-colors">
              Kiosk
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
