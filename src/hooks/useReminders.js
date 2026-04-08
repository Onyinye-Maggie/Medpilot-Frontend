import { useState, useEffect, useCallback, useRef } from 'react';
import { medicationsAPI } from '../utils/api';

const REMINDER_MINUTES = [30, 10, 0];
const CHECK_INTERVAL_MS = 30_000;
const STORAGE_KEY = 'medpilot_fired_reminders';

function getFiredSet() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}

function markFired(key) {
  const s = getFiredSet();
  s.add(key);
  const today = new Date().toDateString();
  const pruned = [...s].filter(k => k.startsWith(today));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
}

function buildScheduledTimes(meds) {
  const now = new Date();
  const entries = [];
  meds.forEach(med => {
    if (!med.isActive) return;
    const times = Array.isArray(med.times) ? med.times : [];
    times.forEach(t => {
      if (!t || !t.includes(':')) return;
      const [hh, mm] = t.split(':').map(Number);
      const scheduled = new Date();
      scheduled.setHours(hh, mm, 0, 0);
      // Only care about upcoming doses (within past 5 min + future)
      if (scheduled < new Date(now.getTime() - 5 * 60_000)) return;
      entries.push({ medId: med._id || med.id, medName: med.name, dosage: med.dosage, time: t, scheduled });
    });
  });
  return entries;
}

export function useReminders(isLoggedIn) {
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission : 'unsupported'
  );
  const [pendingReminders, setPendingReminders] = useState([]);
  const timerRef = useRef(null);
  const medsRef  = useRef([]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const fireReminder = useCallback((entry, minutesBefore) => {
    const firedKey = `${new Date().toDateString()}_${entry.medId}_${entry.time}_${minutesBefore}`;
    if (getFiredSet().has(firedKey)) return;
    markFired(firedKey);

    const isNow  = minutesBefore === 0;
    const title  = isNow
      ? `💊 Time to take ${entry.medName}`
      : `⏰ ${entry.medName} in ${minutesBefore} min`;
    const body   = `${entry.dosage} — scheduled for ${entry.time}`;

    // Browser notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        const n = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: firedKey,
          requireInteraction: isNow,
        });
        n.onclick = () => { window.focus(); n.close(); };
        if (!isNow) setTimeout(() => n.close(), 12_000);
      } catch { /* ignore */ }
    }

    // In-app bell notification always
    setPendingReminders(prev => [{
      id: firedKey, title, body,
      time: new Date().toISOString(),
      read: false, medId: entry.medId,
      minutesBefore,
    }, ...prev].slice(0, 20));
  }, []);

  const checkReminders = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const r = await medicationsAPI.getAll();
      const list = r.data?.data?.data || r.data?.data || r.data || [];
      medsRef.current = Array.isArray(list) ? list : [];
    } catch { /* silent */ }

    const entries = buildScheduledTimes(medsRef.current);
    const now = new Date();
    entries.forEach(entry => {
      REMINDER_MINUTES.forEach(minsBefore => {
        const fireAt = new Date(entry.scheduled.getTime() - minsBefore * 60_000);
        const diffMs = fireAt.getTime() - now.getTime();
        if (diffMs >= -(CHECK_INTERVAL_MS / 2) && diffMs <= (CHECK_INTERVAL_MS / 2)) {
          fireReminder(entry, minsBefore);
        }
      });
    });
  }, [isLoggedIn, fireReminder]);

  useEffect(() => {
    if (!isLoggedIn) return;
    checkReminders();
    timerRef.current = setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [isLoggedIn, checkReminders]);

  const markRead      = useCallback((id) => setPendingReminders(p => p.map(r => r.id === id ? { ...r, read: true } : r)), []);
  const markAllRead   = useCallback(() => setPendingReminders(p => p.map(r => ({ ...r, read: true }))), []);
  const clearReminder = useCallback((id) => setPendingReminders(p => p.filter(r => r.id !== id)), []);
  const clearAll      = useCallback(() => setPendingReminders([]), []);

  const unreadCount = pendingReminders.filter(r => !r.read).length;

  return { permission, requestPermission, pendingReminders, unreadCount, markRead, markAllRead, clearReminder, clearAll };
}
