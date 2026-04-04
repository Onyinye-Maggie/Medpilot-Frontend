import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AppointmentsPage from './pages/AppointmentsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import ProfilePage from './pages/ProfilePage';
import OTPPage from './pages/OTPPage';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoading />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoading />;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

const AppLoading = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--bg-primary)', flexDirection: 'column', gap: '16px'
  }}>
    <div style={{
      width: '48px', height: '48px', border: '3px solid var(--border-color)',
      borderTop: '3px solid var(--accent-primary)', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
      Initialising MedPilot…
    </p>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-otp" element={<OTPPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="records" element={<MedicalRecordsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              borderRadius: 'var(--radius-md)',
            },
            success: { iconTheme: { primary: 'var(--accent-primary)', secondary: 'var(--bg-card)' } },
            error: { iconTheme: { primary: 'var(--accent-danger)', secondary: 'var(--bg-card)' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
