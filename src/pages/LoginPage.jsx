import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/UI';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [debugResponse, setDebugResponse] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setDebugResponse(null);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.message || data?.error || err?.message || 'Login failed.';

      // Show debug panel for any error so we can see the full response
      setDebugResponse({
        status: err?.response?.status,
        serverResponse: data,
      });

      // Redirect to OTP if unverified
      const unverifiedKeywords = ['verify', 'verification', 'not verified', 'otp', 'confirm', 'activate'];
      if (unverifiedKeywords.some((kw) => msg.toLowerCase().includes(kw))) {
        toast('Please verify your email first', { icon: '📧' });
        navigate('/verify-otp', { state: { email: form.email } });
      } else {
        toast.error(msg, { duration: 6000 });
      }
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

      <div className="auth-card" style={{ maxWidth: debugResponse ? '640px' : '440px' }}>
        <div className="auth-logo">
          <div className="auth-logo__icon"><Activity size={22} /></div>
          <span>Med<b>Pilot</b></span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your MedPilot account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({}); }}
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            icon={Lock}
            value={form.password}
            onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({}); }}
            error={errors.password}
          />
          <Button type="submit" size="lg" loading={loading} style={{ width: '100%' }}>
            Sign In
          </Button>
        </form>

        {/* DEBUG PANEL */}
        {debugResponse && (
          <div style={{
            marginTop: '20px', background: '#0b1f2e',
            border: '1px solid rgba(255,71,87,0.3)', borderRadius: '10px',
            padding: '16px', fontSize: '12px', fontFamily: 'monospace',
            color: '#e8f4f0', textAlign: 'left',
          }}>
            <p style={{ color: '#ff4757', fontWeight: 700, marginBottom: '10px' }}>
              ⚠ Login Response (debug) — Status: {debugResponse.status}
            </p>
            <p style={{ color: '#7a9bac', marginBottom: '6px' }}>Server said:</p>
            <pre style={{ background: '#040d14', padding: '10px', borderRadius: '6px', overflow: 'auto' }}>
              {JSON.stringify(debugResponse.serverResponse, null, 2)}
            </pre>
            <p style={{ color: '#ffa502', marginTop: '10px', fontSize: '11px' }}>
              📋 Also check browser Console (F12) for the full token response.
            </p>
          </div>
        )}

        <p className="auth-switch" style={{ marginTop: '20px' }}>
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
