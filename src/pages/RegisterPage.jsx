import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input, Select, Button } from '../components/UI';
import toast from 'react-hot-toast';
import './AuthPages.css';

const ROLES = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'admin', label: 'Admin' },
  { value: 'pharmacist', label: 'Pharmacist' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.role) e.role = 'Please select a role';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setDebugInfo(null);

    const payload = {
      name: form.name.trim(),
      username: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    };

    try {
      await register(payload);
      toast.success('Account created! Welcome to MedPilot.');
      navigate('/dashboard');
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      // Show full debug info on screen
      setDebugInfo({
        status,
        sentPayload: { ...payload, password: '***hidden***' },
        serverResponse: data,
      });

      const msg =
        data?.message ||
        data?.error ||
        data?.msg ||
        (Array.isArray(data?.errors)
          ? data.errors.map((e) => e.msg || e.message || JSON.stringify(e)).join(', ')
          : null) ||
        (typeof data === 'string' ? data : null) ||
        `Server error (status ${status})`;

      toast.error(msg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
      </div>

      <div className="auth-card" style={{ maxWidth: debugInfo ? '640px' : '440px' }}>
        <div className="auth-logo">
          <div className="auth-logo__icon"><Activity size={22} /></div>
          <span>Med<b>Pilot</b></span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join MedPilot to manage your practice</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Full name *"
            placeholder="e.g. Jane Smith"
            icon={User}
            value={form.name}
            onChange={set('name')}
            error={errors.name}
          />
          <Input
            label="Email address *"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={form.email}
            onChange={set('email')}
            error={errors.email}
          />
          <Select
            label="Role *"
            options={ROLES}
            value={form.role}
            onChange={set('role')}
            error={errors.role}
          />
          <Input
            label="Password *"
            type="password"
            placeholder="Min. 8 characters"
            icon={Lock}
            value={form.password}
            onChange={set('password')}
            error={errors.password}
          />
          <Input
            label="Confirm password *"
            type="password"
            placeholder="Repeat your password"
            icon={Lock}
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
          />

          <Button type="submit" size="lg" loading={loading} style={{ width: '100%' }}>
            Create Account
          </Button>
        </form>

        {/* DEBUG PANEL — shows server response on failure */}
        {debugInfo && (
          <div style={{
            marginTop: '20px',
            background: '#0b1f2e',
            border: '1px solid rgba(255,71,87,0.3)',
            borderRadius: '10px',
            padding: '16px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#e8f4f0',
            textAlign: 'left',
          }}>
            <p style={{ color: '#ff4757', fontWeight: 700, marginBottom: '10px' }}>
              ⚠ Server Response (debug) — Status: {debugInfo.status}
            </p>
            <p style={{ color: '#7a9bac', marginBottom: '6px' }}>Payload sent:</p>
            <pre style={{ background: '#040d14', padding: '10px', borderRadius: '6px', overflow: 'auto', marginBottom: '12px' }}>
              {JSON.stringify(debugInfo.sentPayload, null, 2)}
            </pre>
            <p style={{ color: '#7a9bac', marginBottom: '6px' }}>Server said:</p>
            <pre style={{ background: '#040d14', padding: '10px', borderRadius: '6px', overflow: 'auto' }}>
              {JSON.stringify(debugInfo.serverResponse, null, 2)}
            </pre>
            <p style={{ color: '#7a9bac', marginTop: '10px', fontSize: '11px' }}>
              📋 Copy the "Server said" block and share it so the error can be fixed.
            </p>
          </div>
        )}

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
