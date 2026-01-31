import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataSyncProvider } from './contexts/DataSyncContext';
import { AppConfigProvider } from './contexts/AppConfigContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ElectronMenuHandler } from './components/ElectronMenuHandler';
import { TitleBar } from './components/TitleBar';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingTour } from './components/OnboardingTour';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Staff } from './pages/Staff';
import { Settings } from './pages/Settings';
import { SetupWizard } from './pages/SetupWizard';
const Statistics = React.lazy(() => import('./pages/Statistics'));
const Evaluation = React.lazy(() => import('./pages/Evaluation'));
import { DatabaseDiagnostic } from './pages/DatabaseDiagnostic';
// Debug tools imports - only in development
import { shouldShowDebugTools } from './utils/environment';
// Lazy import for debug tools to avoid loading issues
const DebugTools = React.lazy(() => 
  shouldShowDebugTools() 
    ? import('./pages/DebugTools')
    : Promise.resolve({ default: () => <div>Debug tools not available</div> })
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0011ef]"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0011ef]"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

function App() {
  // Déterminer si on doit afficher le debug en fonction de l'environnement
  const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  
  return (
    <ErrorBoundary>
      <AppConfigProvider>
        <AuthProvider>
          <DataSyncProvider>
            <div className="h-screen flex flex-col overflow-hidden">
              <TitleBar />
              <div className="flex-1 overflow-auto">
                <Router>
                <ElectronMenuHandler>
                <CommandPalette />
                <OnboardingTour />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/setup" 
            element={
              <ProtectedRoute>
                <SetupWizard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff" 
            element={
              <ProtectedRoute>
                <Staff />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/evaluation/:staffId?" 
            element={
<ProtectedRoute>
                <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0011ef]"></div></div>}>
                  <Evaluation />
                </React.Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/statistics" 
            element={
<ProtectedRoute>
                <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0011ef]"></div></div>}>
                  <Statistics />
                </React.Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          {shouldShowDebugTools() && (
            <Route 
              path="/debug" 
              element={
                <ProtectedRoute>
                  <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0011ef]"></div></div>}>
                    <DebugTools />
                  </React.Suspense>
                </ProtectedRoute>
              } 
            />
          )}
          {shouldShowDebugTools() && (
            <Route 
              path="/database-diagnostic" 
              element={
                <ProtectedRoute>
                  <DatabaseDiagnostic />
                </ProtectedRoute>
              } 
            />
          )}
                </Routes>
                </ElectronMenuHandler>
                </Router>
              </div>
            </div>
          </DataSyncProvider>
        </AuthProvider>
      </AppConfigProvider>
    </ErrorBoundary>
  );
}

export default App;