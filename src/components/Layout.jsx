import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, FileText, Pill,
  User, LogOut, Menu, X, ChevronRight, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Layout.css';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/patients', icon: Users, label: 'Patients' },
  { path: '/appointments', icon: Calendar, label: 'Appointments' },
  { path: '/records', icon: FileText, label: 'Medical Records' },
  { path: '/prescriptions', icon: Pill, label: 'Prescriptions' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__logo">
          <div className="logo-icon">
            <Activity size={20} />
          </div>
          <span className="logo-text">Med<span>Pilot</span></span>
          <button className="sidebar__close" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar__nav">
          <p className="sidebar__section-label">Main Menu</p>
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className="sidebar__arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__bottom">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <User size={18} />
            <span>Profile</span>
            <ChevronRight size={14} className="sidebar__arrow" />
          </NavLink>
          <button className="sidebar__link sidebar__logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="layout__main">
        {/* Topbar */}
        <header className="topbar">
          <button className="topbar__menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar__left">
            <div className="pulse-dot" />
            <span className="topbar__status">System Online</span>
          </div>
          <div className="topbar__right">
            <div className="topbar__user">
              <div className="user-avatar">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'D'}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || 'Doctor'}</span>
                <span className="user-role">{user?.role || 'Physician'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
