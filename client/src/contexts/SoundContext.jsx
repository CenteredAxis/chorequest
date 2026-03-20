import React, { createContext, useContext, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';

const SoundContext = createContext(null);

// Synthesize simple sounds using Web Audio API — no external files needed
function createAudioContext() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return null;
  }
}

function playCoinSound(ctx) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

function playLevelUpSound(ctx) {
  if (!ctx) return;
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

function playCompleteSound(ctx) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

export function SoundProvider({ children }) {
  const audioCtxRef = useRef(null);
  const { settings } = useAuth();

  const ensureCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playSound = useCallback((type) => {
    if (settings && settings.sound_enabled === 0) return;
    const ctx = ensureCtx();
    switch (type) {
      case 'coin':     return playCoinSound(ctx);
      case 'levelup':  return playLevelUpSound(ctx);
      case 'complete': return playCompleteSound(ctx);
      default: break;
    }
  }, [settings, ensureCtx]);

  return (
    <SoundContext.Provider value={{ playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within SoundProvider');
  return ctx;
}
