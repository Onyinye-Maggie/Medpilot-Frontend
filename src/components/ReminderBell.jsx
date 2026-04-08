import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellOff, X, CheckCheck, Pill, Clock } from 'lucide-react';
import { useReminderContext } from '../context/ReminderContext';
import { formatDistanceToNow } from 'date-fns';
import './ReminderBell.css';

export default function ReminderBell() {
  const {
    permission, requestPermission,
    pendingReminders, unreadCount,
    markRead, markAllRead, clearReminder, clearAll,
  } = useReminderContext();

  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    setOpen(v => !v);
    if (!open && unreadCount > 0) markAllRead();
  };

  const notifSupported = typeof window !== 'undefined' && 'Notification' in window;

  return (
    <div className="bell-wrap" ref={dropRef}>
      {/* Bell button */}
      <button className={`bell-btn ${unreadCount > 0 ? 'bell-btn--active' : ''}`} onClick={handleBellClick} title="Medication reminders">
        {permission === 'denied' ? <BellOff size={20} /> : <Bell size={20} />}
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="bell-dropdown">
          <div className="bell-dropdown__header">
            <div className="bell-dropdown__title">
              <Bell size={16} />
              <span>Reminders</span>
              {unreadCount > 0 && <span className="bell-count">{unreadCount}</span>}
            </div>
            <div className="bell-dropdown__actions">
              {pendingReminders.length > 0 && (
                <>
                  <button className="bell-action-btn" onClick={markAllRead} title="Mark all read"><CheckCheck size={14} /></button>
                  <button className="bell-action-btn bell-action-btn--danger" onClick={clearAll} title="Clear all"><X size={14} /></button>
                </>
              )}
            </div>
          </div>

          {/* Browser notification permission banner */}
          {notifSupported && permission === 'default' && (
            <div className="bell-permission-banner">
              <p>Enable browser notifications to get reminders even when the tab is in the background.</p>
              <button className="bell-permission-btn" onClick={requestPermission}>Enable Notifications</button>
            </div>
          )}
          {notifSupported && permission === 'denied' && (
            <div className="bell-permission-banner bell-permission-banner--denied">
              <BellOff size={14} />
              <p>Browser notifications blocked. In-app reminders still work.</p>
            </div>
          )}

          {/* Reminder list */}
          <div className="bell-list">
            {pendingReminders.length === 0 ? (
              <div className="bell-empty">
                <Bell size={28} />
                <p>No reminders yet</p>
                <span>Reminders appear 30 min, 10 min, and at dose time</span>
              </div>
            ) : (
              pendingReminders.map(r => (
                <div key={r.id} className={`bell-item ${r.read ? 'bell-item--read' : ''}`}
                  onClick={() => markRead(r.id)}>
                  <div className={`bell-item__icon ${r.minutesBefore === 0 ? 'bell-item__icon--now' : ''}`}>
                    {r.minutesBefore === 0 ? <Pill size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="bell-item__content">
                    <p className="bell-item__title">{r.title}</p>
                    <p className="bell-item__body">{r.body}</p>
                    <p className="bell-item__time">
                      {formatDistanceToNow(new Date(r.time), { addSuffix: true })}
                    </p>
                  </div>
                  <button className="bell-item__close" onClick={(e) => { e.stopPropagation(); clearReminder(r.id); }}>
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer info */}
          <div className="bell-footer">
            <Clock size={12} />
            <span>Reminds at 30 min, 10 min, and at dose time</span>
          </div>
        </div>
      )}
    </div>
  );
}
