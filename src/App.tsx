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

// AuthWrapper component to handle auth state and redirects
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If not authenticated and not on auth pages, redirect to login
    if (!isAuthenticated && !['/login', '/register'].includes(location.pathname)) {
      navigate('/login');
    }
    
    // If authenticated and on auth pages, redirect to dashboard
    if (isAuthenticated && ['/login', '/register'].includes(location.pathname)) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return <>{children}</>;
}

// Protected Route component
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

function App() {
  return (
    <Router>
      <AuthWrapper>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

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
          <Route path="/workflows" element={
            <ProtectedRoute>
              <AppLayout>
                <WorkflowsPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Redirect root to dashboard or login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all route - redirect to dashboard or login */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthWrapper>
    </Router>
  );
}

export default App;