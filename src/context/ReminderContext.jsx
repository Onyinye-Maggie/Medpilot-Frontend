import React, { createContext, useContext } from 'react';
import { useReminders } from '../hooks/useReminders';
import { useAuth } from './AuthContext';

const ReminderContext = createContext(null);

export const ReminderProvider = ({ children }) => {
  const { user } = useAuth();
  const reminders = useReminders(!!user);
  return (
    <ReminderContext.Provider value={reminders}>
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminderContext = () => {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error('useReminderContext must be used within ReminderProvider');
  return ctx;
};
