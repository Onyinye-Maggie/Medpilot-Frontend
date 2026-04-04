import React, { useState } from 'react';
import { User, Mail, Lock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { PageHeader, Card, Input, Select, Button } from '../components/UI';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const ROLE_OPTIONS = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'admin', label: 'Admin' },
  { value: 'pharmacist', label: 'Pharmacist' },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const setP = (f) => (e) => setProfileForm(prev => ({ ...prev, [f]: e.target.value }));
  const setPw = (f) => (e) => setPwForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data?.data || res.data?.user || { ...user, ...profileForm });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSavingPw(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally { setSavingPw(false); }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account information"
      />

      <div className="profile-grid">
        {/* Avatar Section */}
        <Card className="profile-avatar-card">
          <div className="profile-big-avatar">
            {(user?.name?.[0] || 'D').toUpperCase()}
          </div>
          <h2 className="profile-fullname">{user?.name || 'Doctor'}</h2>
          <p className="profile-role-label">{user?.role || 'Physician'}</p>
          <p className="profile-email-label">{user?.email}</p>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat__value">—</span>
              <span className="profile-stat__label">Patients</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat__value">—</span>
              <span className="profile-stat__label">Appointments</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat__value">—</span>
              <span className="profile-stat__label">Records</span>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <div className="profile-forms">
          <Card>
            <h3 className="profile-section-title">
              <User size={16} /> Personal Information
            </h3>
            <form onSubmit={handleProfileSave} className="profile-form">
              <div className="form-grid-2">
                <Input label="Full Name" icon={User} value={profileForm.name} onChange={setP('name')} />
                <Input label="Email" type="email" icon={Mail} value={profileForm.email} onChange={setP('email')} />
              </div>
              <div className="form-grid-2">
                <Select label="Role" options={ROLE_OPTIONS} value={profileForm.role} onChange={setP('role')} />
                <Input label="Phone" value={profileForm.phone} onChange={setP('phone')} />
              </div>
              <Input label="Specialization" placeholder="e.g. General Practitioner, Cardiology…"
                value={profileForm.specialization} onChange={setP('specialization')} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" icon={<Save size={15} />} loading={savingProfile}>
                  Save Profile
                </Button>
              </div>
            </form>
          </Card>

          <Card style={{ marginTop: '16px' }}>
            <h3 className="profile-section-title">
              <Lock size={16} /> Change Password
            </h3>
            <form onSubmit={handlePasswordChange} className="profile-form">
              <Input label="Current Password" type="password" icon={Lock}
                value={pwForm.currentPassword} onChange={setPw('currentPassword')} required />
              <div className="form-grid-2">
                <Input label="New Password" type="password" icon={Lock}
                  value={pwForm.newPassword} onChange={setPw('newPassword')} required />
                <Input label="Confirm New Password" type="password" icon={Lock}
                  value={pwForm.confirmPassword} onChange={setPw('confirmPassword')} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" icon={<Save size={15} />} loading={savingPw}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
