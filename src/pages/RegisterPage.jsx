import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input, Select, Button } from '../components/UI';
import toast from 'react-hot-toast';
import './AuthPages.css';

const ROLES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'admin', label: 'Admin' },
  { value: 'pharmacist', label: 'Pharmacist' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => { setForm({ ...form, [field]: e.target.value }); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      toast.success('Account created! Welcome to MedPilot.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed.';
      toast.error(msg);
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

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo__icon"><Activity size={22} /></div>
          <span>Med<b>Pilot</b></span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join MedPilot to manage your practice</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input label="Full name" placeholder="Dr. Jane Smith" icon={User}
            value={form.name} onChange={set('name')} error={errors.name} />
          <Input label="Email address" type="email" placeholder="doctor@hospital.com" icon={Mail}
            value={form.email} onChange={set('email')} error={errors.email} />
          <Select label="Role" options={ROLES}
            value={form.role} onChange={set('role')} />
          <Input label="Password" type="password" placeholder="Min. 8 characters" icon={Lock}
            value={form.password} onChange={set('password')} error={errors.password} />
          <Input label="Confirm password" type="password" placeholder="Repeat password" icon={Lock}
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
