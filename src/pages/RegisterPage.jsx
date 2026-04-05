import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Activity, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input, Select, Button } from '../components/UI';
import toast from 'react-hot-toast';
import './AuthPages.css';
import './ResponsiveGrid.css';

const ROLES = [
  { value: 'patient',    label: 'Patient' },
  { value: 'doctor',     label: 'Doctor' },
  { value: 'nurse',      label: 'Nurse' },
  { value: 'admin',      label: 'Admin' },
  { value: 'pharmacist', label: 'Pharmacist' },
];

const PW_RULES = [
  { re: /.{8,}/,            label: 'At least 8 characters' },
  { re: /[A-Z]/,            label: 'One uppercase letter' },
  { re: /[a-z]/,            label: 'One lowercase letter' },
  { re: /\d/,               label: 'One number' },
  { re: /[!@#$%^&*()_+\-={}|;:,.<>?]/, label: 'One special character (!@#$…)' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'patient' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.role) e.role = 'Please select a role';
    if (!form.password) e.password = 'Password is required';
    else if (!PW_RULES.every(r => r.re.test(form.password)))
      e.password = 'Password does not meet all requirements below';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
      });
      toast.success('Account created! Please verify your email.');
      navigate('/verify-otp', { state: { email: form.email.trim().toLowerCase(), password: form.password, fromRegister: true } });
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.message || data?.error ||
        (Array.isArray(data?.errors) ? data.errors.map(e => e.message || e.msg).join(', ') : null) ||
        'Registration failed.';
      toast.error(msg, { duration: 6000 });
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
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join MedPilot to manage your health</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input label="Full name *" placeholder="e.g. Jane Smith" icon={User}
            value={form.name} onChange={set('name')} error={errors.name} />
          <Input label="Email address *" type="email" placeholder="you@example.com" icon={Mail}
            value={form.email} onChange={set('email')} error={errors.email} />
          <Select label="Role *" options={ROLES} value={form.role} onChange={set('role')} error={errors.role} />

          {/* Password with strength hints */}
          <div style={{ position: 'relative' }}>
            <Input
              label="Password *"
              type={showPw ? 'text' : 'password'}
              placeholder="e.g. Abc@1234"
              icon={Lock}
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position:'absolute', right:10, top:33, background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>

          {/* Password requirements */}
          {(pwFocused || form.password) && (
            <div style={{ background:'var(--bg-secondary)', borderRadius:'var(--radius-sm)', padding:'10px 14px', display:'flex', flexDirection:'column', gap:'4px' }}>
              {PW_RULES.map(r => {
                const ok = r.re.test(form.password);
                return (
                  <div key={r.label} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color: ok ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                    <span style={{ fontSize:'10px' }}>{ok ? '✓' : '○'}</span>
                    {r.label}
                  </div>
                );
              })}
            </div>
          )}

          <Input label="Confirm password *" type="password" placeholder="Repeat your password" icon={Lock}
            value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />

          <Button type="submit" size="lg" loading={loading} style={{ width: '100%' }}>
            Create Account
          </Button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
