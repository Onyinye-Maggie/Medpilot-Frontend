import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReminderProvider } from './context/ReminderContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPPage from './pages/OTPPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import MedicationsPage from './pages/MedicationsPage';
import DosesPage from './pages/DosesPage';
import RefillsPage from './pages/RefillsPage';
import AdminRefillsPage from './pages/AdminRefillsPage';
import ProfilePage from './pages/ProfilePage';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppLoading = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)', flexDirection:'column', gap:'16px' }}>
    <div style={{ width:'48px', height:'48px', border:'3px solid var(--border-color)', borderTop:'3px solid var(--accent-primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <p style={{ color:'var(--text-secondary)', fontFamily:'var(--font-body)', fontSize:'14px' }}>Initialising MedPilot…</p>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-otp" element={<OTPPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard"    element={<DashboardPage />} />
        <Route path="medications"  element={<MedicationsPage />} />
        <Route path="doses"        element={<DosesPage />} />
        <Route path="refills"      element={<RefillsPage />} />
        <Route path="admin/refills" element={<AdminRefillsPage />} />
        <Route path="profile"      element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ReminderProvider>
        <Router>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background:'var(--bg-card)', color:'var(--text-primary)', border:'1px solid var(--border-color)', fontFamily:'var(--font-body)', fontSize:'14px', borderRadius:'var(--radius-md)' },
              success: { iconTheme: { primary:'var(--accent-primary)', secondary:'var(--bg-card)' } },
              error:   { iconTheme: { primary:'var(--accent-danger)',  secondary:'var(--bg-card)' } },
            }}
          />
        </Router>
      </ReminderProvider>
    </AuthProvider>
  );
}

export default App;
