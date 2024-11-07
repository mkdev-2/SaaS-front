import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import AdminDashboard from './components/admin/AdminDashboard';
import Dashboard from './components/Dashboard';
import IntegrationsPage from './components/integrations/IntegrationsPage';
import WorkflowsPage from './components/workflows/WorkflowsPage';
import KommoTestingPage from './components/testing/KommoTestingPage';
import KommoConnectionResult from './components/integrations/kommo/KommoConnectionResult';
import KommoCallback from './components/integrations/kommo/KommoCallback';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import useAuthStore from './store/authStore';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && ['/login', '/register'].includes(location.pathname)) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      <main className="pl-64 pt-16">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthWrapper>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/kommo/callback" element={<KommoCallback />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/integrations" element={
            <ProtectedRoute>
              <AppLayout>
                <IntegrationsPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/integrations/kommo/result" element={
            <ProtectedRoute>
              <AppLayout>
                <KommoConnectionResult />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/workflows" element={
            <ProtectedRoute>
              <AppLayout>
                <WorkflowsPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/tests" element={
            <ProtectedRoute>
              <AppLayout>
                <KommoTestingPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthWrapper>
    </Router>
  );
}