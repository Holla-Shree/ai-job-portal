
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
  status: 'Applied' | 'Under Review' | 'Interview' | 'Rejected' | 'Offer';
  candidateId?: string; // Add candidateId to link notifications
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
  applicationHistory: ApplicationNotification[];
  updateApplicationStatus: (candidateId: string, status: ApplicationNotification['status']) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = 'jobApplicationNotifications';
const CONVERSATIONS_STORAGE_KEY = 'jobMatchConversations'; // Using a different key for messaging
const APPLICATION_HISTORY_KEY = 'jobSeekerApplicationHistory';

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ApplicationNotification[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<ApplicationNotification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
      const storedHistory = localStorage.getItem(APPLICATION_HISTORY_KEY);
       if (storedHistory) {
        setApplicationHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(APPLICATION_HISTORY_KEY, JSON.stringify(applicationHistory));
  }, [applicationHistory]);

  const addNotification = (jobTitle: string, company: string) => {
    // In a real app, you'd get the user's ID. Here we'll mock one.
    const candidateId = `cand-${Math.floor(Math.random() * 1000)}`;
    const newApplication: ApplicationNotification = {
      id: `app-${Date.now()}`,
      jobTitle,
      company,
      candidateName: 'Priya Patel', // Mock candidate name for demo
      timestamp: Date.now(),
      read: false,
      status: 'Applied',
      candidateId: candidateId,
    };
    
    // Add to recruiter notifications
    setNotifications(prev => [newApplication, ...prev]);
    // Add to user's application history
    setApplicationHistory(prev => [newApplication, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };
  
  const updateApplicationStatus = (candidateId: string, status: ApplicationNotification['status']) => {
    setApplicationHistory(prev =>
      prev.map(app => (app.candidateId === candidateId ? { ...app, status } : app))
    );
    // You could also create a new notification for the user here
    // to inform them of the status change.
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
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, initiateConversation, applicationHistory, updateApplicationStatus }}>
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
