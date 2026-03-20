import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { SoundProvider } from './contexts/SoundContext.jsx';

// Parent pages
import ParentLogin from './pages/parent/ParentLogin.jsx';
import ParentLayout from './pages/parent/ParentLayout.jsx';
import ParentDashboard from './pages/parent/ParentDashboard.jsx';
import ParentKids from './pages/parent/ParentKids.jsx';
import ParentChores from './pages/parent/ParentChores.jsx';
import ParentShop from './pages/parent/ParentShop.jsx';
import ParentSettings from './pages/parent/ParentSettings.jsx';

// Kiosk pages
import KioskLayout from './pages/kiosk/KioskLayout.jsx';
import KioskAvatarSelect from './pages/kiosk/KioskAvatarSelect.jsx';
import KioskDashboard from './pages/kiosk/KioskDashboard.jsx';
import KioskChores from './pages/kiosk/KioskChores.jsx';
import KioskShop from './pages/kiosk/KioskShop.jsx';
import KioskBadges from './pages/kiosk/KioskBadges.jsx';

import { QuestLoadingScreen } from './components/ui/Spinner.jsx';

function ProtectedParentRoute({ children }) {
  const { isParent, isLoading } = useAuth();
  if (isLoading) return <QuestLoadingScreen />;
  if (!isParent) return <Navigate to="/login" replace />;
  return children;
}

function ProtectedKioskRoute({ children }) {
  const { isChild, isLoading } = useAuth();
  if (isLoading) return <QuestLoadingScreen />;
  if (!isChild) return <Navigate to="/kiosk" replace />;
  return children;
}

function AppRoutes() {
  const { isLoading, isParent, isChild, isAuthenticated } = useAuth();

  if (isLoading) {
    return <QuestLoadingScreen />;
  }

  return (
    <Routes>
      {/* Parent routes */}
      <Route path="/login" element={<ParentLogin />} />
      <Route
        path="/parent/*"
        element={
          <ProtectedParentRoute>
            <ParentLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/parent/dashboard" replace />} />
                <Route path="dashboard" element={<ParentDashboard />} />
                <Route path="kids" element={<ParentKids />} />
                <Route path="chores" element={<ParentChores />} />
                <Route path="shop" element={<ParentShop />} />
                <Route path="settings" element={<ParentSettings />} />
              </Routes>
            </ParentLayout>
          </ProtectedParentRoute>
        }
      />

      {/* Kiosk routes */}
      <Route path="/kiosk" element={<KioskAvatarSelect />} />
      <Route
        path="/kiosk/*"
        element={
          <ProtectedKioskRoute>
            <KioskLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/kiosk/dashboard" replace />} />
                <Route path="dashboard" element={<KioskDashboard />} />
                <Route path="chores" element={<KioskChores />} />
                <Route path="shop" element={<KioskShop />} />
                <Route path="badges" element={<KioskBadges />} />
              </Routes>
            </KioskLayout>
          </ProtectedKioskRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={
        isParent ? <Navigate to="/parent/dashboard" replace /> :
        isChild ? <Navigate to="/kiosk/dashboard" replace /> :
        <Navigate to="/login" replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SoundProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </SoundProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
