import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, RefreshCw } from 'lucide-react';
import { authAPI } from '../utils/api';
import { Button } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPages.css';
import './OTPPage.css';

export default function OTPPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Email passed from register/login page via router state
  const email = location.state?.email || '';
  const password = location.state?.password || '';
  const fromRegister = location.state?.fromRegister || false;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if no email context
  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (index, value) => {
    // Allow only digits
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only last char
    setOtp(newOtp);
    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }
    setLoading(true);
    try {
      // Try both common endpoint patterns
      try {
        await authAPI.verifyOTP({ email, otp: code, token: code, code });
      } catch {
        await authAPI.verifyEmail({ email, otp: code, token: code, code });
      }

      toast.success('Email verified successfully!');

      // If we have credentials, auto-login after verification
      if (password) {
        try {
          await login({ email, password });
          navigate('/dashboard');
        } catch {
          toast('Please log in to continue', { icon: '🔐' });
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.message || data?.error ||
        (Array.isArray(data?.errors) ? data.errors.map((e) => e.message || e.msg).join(', ') : null) ||
        'Invalid or expired OTP. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      try {
        await authAPI.resendOTP({ email });
      } catch {
        await authAPI.resendVerification({ email });
      }
      toast.success('A new OTP has been sent to your email');
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to resend OTP';
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
      </div>

      <div className="auth-card otp-card">
        <div className="auth-logo">
          <div className="auth-logo__icon"><Activity size={22} /></div>
          <span>Med<b>Pilot</b></span>
        </div>

        <div className="otp-icon">
          <Mail size={28} />
        </div>

        <h1 className="auth-title">Check your email</h1>
        <p className="auth-subtitle">
          We sent a 6-digit verification code to<br />
          <strong style={{ color: 'var(--accent-primary)' }}>{email}</strong>
        </p>

        <form onSubmit={handleVerify} className="otp-form">
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                className={`otp-input ${digit ? 'otp-input--filled' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <Button
            type="submit"
            size="lg"
            loading={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            Verify Email
          </Button>
        </form>

        <div className="otp-resend">
          {canResend ? (
            <button
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={resending}
            >
              <RefreshCw size={14} />
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          ) : (
            <p className="otp-countdown">
              Resend code in <span>{countdown}s</span>
            </p>
          )}
        </div>

        <p className="auth-switch">
          Wrong email?{' '}
          <Link to="/register" className="auth-link">Go back</Link>
        </p>
      </div>
    </div>
  );
}
