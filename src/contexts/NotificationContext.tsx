
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface ApplicationNotification {
  id: string;
  jobTitle: string;
  company: string;
  candidateName: string; // In a real app, this would be the user's name
  timestamp: number;
  read: boolean;
}

interface NotificationContextType {
  notifications: ApplicationNotification[];
  addNotification: (jobTitle: string, company: string) => void;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = 'jobApplicationNotifications';

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ApplicationNotification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
    } catch (error) {
      console.error("Failed to load notifications from localStorage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (jobTitle: string, company: string) => {
    const newNotification: ApplicationNotification = {
      id: `notif-${Date.now()}`,
      jobTitle,
      company,
      candidateName: 'Priya Patel', // Mock candidate name for demo
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
