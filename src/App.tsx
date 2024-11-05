import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import AdminDashboard from './components/admin/AdminDashboard';
import Dashboard from './components/Dashboard';
import IntegrationsPage from './components/integrations/IntegrationsPage';
import WorkflowsPage from './components/workflows/WorkflowsPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import useAuthStore from './store/authStore';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      checkAuth().catch(() => {
        // Error handling is done in the store
      });
    }
  }, [isAuthenticated, checkAuth]);

  // Don't protect auth routes
  if (['/login', '/register'].includes(location.pathname)) {
    return <>{children}</>;
  }

  // Protect all other routes
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

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } />
          <Route path="/admin" element={
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          } />
          <Route path="/integrations" element={
            <AppLayout>
              <IntegrationsPage />
            </AppLayout>
          } />
          <Route path="/workflows" element={
            <AppLayout>
              <WorkflowsPage />
            </AppLayout>
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