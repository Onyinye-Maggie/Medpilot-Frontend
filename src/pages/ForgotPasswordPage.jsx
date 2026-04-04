import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Activity } from 'lucide-react';
import { authAPI } from '../utils/api';
import { Input, Button } from '../components/UI';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('If that email exists, a reset link has been sent');
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-grid"/><div className="auth-orb auth-orb--1"/><div className="auth-orb auth-orb--2"/></div>
      <div className="auth-card">
        <div className="auth-logo"><div className="auth-logo__icon"><Activity size={22}/></div><span>Med<b>Pilot</b></span></div>
        <h1 className="auth-title">{sent ? 'Check your email' : 'Forgot password'}</h1>
        <p className="auth-subtitle">{sent ? `We sent a reset link to ${email}` : 'Enter your email to receive a password reset link'}</p>
        {!sent && (
          <form onSubmit={handleSubmit} className="auth-form">
            <Input label="Email address" type="email" placeholder="you@example.com" icon={Mail}
              value={email} onChange={e=>setEmail(e.target.value)}/>
            <Button type="submit" size="lg" loading={loading} style={{width:'100%'}}>Send Reset Link</Button>
          </form>
        )}
        <p className="auth-switch"><Link to="/login" className="auth-link">← Back to login</Link></p>
      </div>
    </div>
  );
}
