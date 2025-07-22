
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

interface ConversationStub {
    jobTitle: string;
    company: string;
    partnerName: string;
}

interface NotificationContextType {
  notifications: ApplicationNotification[];
  addNotification: (jobTitle: string, company: string) => void;
  markAsRead: (id: string) => void;
  initiateConversation: (stub: ConversationStub) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = 'jobApplicationNotifications';
const CONVERSATIONS_STORAGE_KEY = 'jobMatchConversations'; // Using a different key for messaging

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

  const initiateConversation = (stub: ConversationStub): string => {
    const existingConversationsStr = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    const existingConversations = existingConversationsStr ? JSON.parse(existingConversationsStr) : [];
    
    // Check if a conversation for this job already exists
    const existingConvo = existingConversations.find((c: any) => c.jobTitle === stub.jobTitle && c.partnerName === stub.partnerName);
    if(existingConvo) {
        return existingConvo.id;
    }

    const newConversation = {
      id: `conv-${Date.now()}`,
      partnerName: stub.partnerName,
      partnerRole: 'Recruiter',
      jobTitle: stub.jobTitle,
      lastMessage: 'I have a question about this role.',
      avatar: stub.partnerName.charAt(0).toUpperCase(),
      messages: [
        { id: `msg-${Date.now()}`, sender: 'me', text: `Hi, I'd like to ask a question about the ${stub.jobTitle} position.`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ],
      pinned: false,
      favourited: false,
      unread: false,
      timestamp: Date.now(),
    };

    const updatedConversations = [newConversation, ...existingConversations];
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updatedConversations));

    return newConversation.id;
  }

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, initiateConversation }}>
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
