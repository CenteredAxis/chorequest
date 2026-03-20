import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    status: 'loading', // 'loading' | 'unauthenticated' | 'parent' | 'child'
    parent: null,
    child: null,
    settings: null,
  });

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.whoami();
      if (data.type === 'parent') {
        setState({ status: 'parent', parent: data.parent, child: null, settings: data.settings });
      } else if (data.type === 'child') {
        setState({ status: 'child', parent: null, child: data.child, settings: data.settings });
      } else {
        setState({ status: 'unauthenticated', parent: null, child: null, settings: null });
      }
    } catch {
      setState({ status: 'unauthenticated', parent: null, child: null, settings: null });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const parentLogin = useCallback(async (username, password) => {
    const data = await authApi.parentLogin({ username, password });
    setState({ status: 'parent', parent: data.parent, child: null, settings: data.settings });
    return data;
  }, []);

  const parentLogout = useCallback(async () => {
    await authApi.parentLogout();
    setState({ status: 'unauthenticated', parent: null, child: null, settings: null });
  }, []);

  const childLogin = useCallback(async (kidId, pin) => {
    const data = await authApi.childLogin({ kid_id: kidId, pin });
    setState({ status: 'child', parent: null, child: data.child, settings: data.settings });
    return data;
  }, []);

  const childLogout = useCallback(async () => {
    await authApi.childLogout();
    setState({ status: 'unauthenticated', parent: null, child: null, settings: null });
  }, []);

  const updateChild = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      child: prev.child ? { ...prev.child, ...updates } : prev.child
    }));
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      isLoading: state.status === 'loading',
      isParent: state.status === 'parent',
      isChild: state.status === 'child',
      isAuthenticated: state.status === 'parent' || state.status === 'child',
      parentLogin,
      parentLogout,
      childLogin,
      childLogout,
      updateChild,
      updateSettings,
      refresh
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
