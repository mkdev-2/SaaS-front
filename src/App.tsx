import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import AdminDashboard from './components/admin/AdminDashboard';
import Dashboard from './components/Dashboard';
import IntegrationsPage from './components/integrations/IntegrationsPage';
import WorkflowsPage from './components/workflows/WorkflowsPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Mock authentication state (replace with actual auth logic)
const isAuthenticated = true;
const userRole = 'CLIENT';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Sidebar />
        <main className="pl-64 pt-16">
          <Routes>
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  {userRole === 'ROOT' ? <AdminDashboard /> : <Navigate to="/" />}
                </PrivateRoute>
              }
            />
            <Route
              path="/integrations"
              element={
                <PrivateRoute>
                  <IntegrationsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/workflows"
              element={
                <PrivateRoute>
                  <WorkflowsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;