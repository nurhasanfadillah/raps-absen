import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import { FeedbackProvider } from './components/Feedback';
import { Layout } from './components/Layout';
import { InstallPrompt } from './components/InstallPrompt';
import { ErrorBoundary } from './components/error-boundary';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import CashAdvancePage from './pages/CashAdvance';
import Payroll from './pages/Payroll';
import Login from './pages/Login';
import Settings from './pages/Settings';
import ActivityLogs from './pages/ActivityLogs';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  if (!isAuthenticated) return <Login />;

  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cash-advance"
        element={
          <ProtectedRoute>
            <CashAdvancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute>
            <Payroll />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity-logs"
        element={
          <ProtectedRoute>
            <ActivityLogs />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <FeedbackProvider>
        <HashRouter>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </HashRouter>
        <InstallPrompt />
      </FeedbackProvider>
    </AppProvider>
  );
};

export default App;
