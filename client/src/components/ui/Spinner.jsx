import React from 'react';

export default function Spinner({ size = 'md', className = '', color = 'text-blue-600' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size] || sizes.md} ${color} ${className}`}>
      <svg className="animate-spin w-full h-full" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Spinner size="lg" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

export function QuestLoadingScreen({ message = 'Loading your quest...' }) {
  return (
    <div className="kiosk-root flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="text-6xl animate-float">⚔️</div>
      <Spinner size="lg" color="text-yellow-400" />
      <p className="text-white/60 text-lg font-quest">{message}</p>
    </div>
  );
}
