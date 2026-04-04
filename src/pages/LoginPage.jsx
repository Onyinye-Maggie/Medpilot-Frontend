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
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.message || data?.error || err?.message || 'Login failed.';
      const unverified = ['verify','verification','not verified','otp','confirm','activate'];
      if (unverified.some(kw => msg.toLowerCase().includes(kw))) {
        toast('Please verify your email first', { icon: '📧' });
        navigate('/verify-otp', { state: { email: form.email } });
      } else {
        toast.error(msg);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
      </div>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo__icon"><Activity size={22} /></div>
          <span>Med<b>Pilot</b></span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your MedPilot account</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <Input label="Email address" type="email" placeholder="you@example.com" icon={Mail}
            value={form.email} onChange={e => { setForm({...form, email:e.target.value}); setErrors({}); }} error={errors.email} />
          <Input label="Password" type="password" placeholder="Enter your password" icon={Lock}
            value={form.password} onChange={e => { setForm({...form, password:e.target.value}); setErrors({}); }} error={errors.password} />
          <div style={{textAlign:'right', marginTop:'-8px'}}>
            <Link to="/forgot-password" style={{fontSize:'13px', color:'var(--accent-primary)'}}>Forgot password?</Link>
          </div>
          <Button type="submit" size="lg" loading={loading} style={{ width: '100%' }}>Sign In</Button>
        </form>
        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
