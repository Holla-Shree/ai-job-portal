

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { collection, addDoc, getDocs, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore"; 
import { db } from '@/lib/firebase';

export interface Message {
  id: string;
  sender: 'me' | 'other' | 'system';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  partnerName: string;
  partnerRole: 'Recruiter' | 'Candidate' | 'System';
  jobTitle: string;
  lastMessage: string;
  avatar: string;
  messages: Message[];
  pinned: boolean;
  favourited: boolean;
  unread: boolean;
  muted: boolean;
  timestamp: number;
}


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
    createEmpty?: boolean;
}

export type Job = { 
    id: string; 
    title: string; 
    company: string; 
    city: string; 
    position: { lat: number; lng: number; }; 
    type: string; 
    domain: string; 
    salary: string; 
    description: string; 
};

export type Candidate = {
    id: string;
    name: string;
    profile: string;
};

interface NotificationContextType {
  notifications: ApplicationNotification[];
  addNotification: (jobTitle: string, company: string) => void;
  markAsRead: (id: string) => void;
  toggleMute: (id: string) => void;
  initiateConversation: (stub: ConversationStub) => string;
  applicationHistory: ApplicationNotification[];
  updateApplicationStatus: (candidateId: string, status: ApplicationNotification['status']) => void;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  jobs: Job[];
  addJob: (job: Omit<Job, 'id' | 'position'>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  candidates: Candidate[];
  updateCandidateProfile: (candidateId: string, profileData: { name: string, profile: string }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = 'jobApplicationNotifications';
const CONVERSATIONS_STORAGE_KEY = 'jobMatchConversations';
const APPLICATION_HISTORY_KEY = 'jobSeekerApplicationHistory';


const getMockConversations = (role: 'recruiter' | 'user' | 'admin'): Conversation[] => {
    if (role === 'user') {
      return [
        {
          id: 'conv1',
          partnerName: 'Recruiter @ TekSystems India',
          partnerRole: 'Recruiter',
          jobTitle: 'Senior Backend Engineer',
          lastMessage: 'That sounds great! I am available to chat tomorrow.',
          avatar: 'R',
          messages: [
            { id: 'msg1', sender: 'other', text: 'Hi Priya, thanks for your interest in the Senior Backend Engineer role. Your profile looks impressive.', timestamp: '10:30 AM' },
            { id: 'msg2', sender: 'me', text: 'Thank you! I am very interested in the position.', timestamp: '10:31 AM' },
            { id: 'msg3', sender: 'other', text: 'Excellent. Would you be available for a brief call tomorrow to discuss your experience further?', timestamp: '10:32 AM' },
            { id: 'msg4', sender: 'me', text: 'That sounds great! I am available to chat tomorrow.', timestamp: '10:33 AM' },
          ],
          pinned: true,
          favourited: true,
          unread: false,
          muted: false,
          timestamp: Date.now() - 1000 * 60 * 5,
        },
        {
          id: 'conv2',
          partnerName: 'HR @ Google',
          partnerRole: 'Recruiter',
          jobTitle: 'Data Scientist',
          lastMessage: 'Sure, I will share it shortly.',
          avatar: 'G',
          messages: [
            { id: 'msg1', sender: 'other', text: 'Hi there, we have received your application for the Data Scientist role. Can you please share your portfolio?', timestamp: 'Yesterday' },
            { id: 'msg2', sender: 'me', text: 'Sure, I will share it shortly.', timestamp: 'Yesterday' },
          ],
          pinned: false,
          favourited: false,
          unread: true,
          muted: true,
          timestamp: Date.now() - 1000 * 60 * 60 * 24,
        },
      ];
    }
    return [
      {
        id: 'conv1',
        partnerName: 'Priya Patel',
        partnerRole: 'Candidate',
        jobTitle: 'Senior Backend Engineer',
        lastMessage: 'That sounds great! I am available to chat tomorrow.',
        avatar: 'PP',
        messages: [
          { id: 'msg1', sender: 'me', text: 'Hi Priya, thanks for your interest in the Senior Backend Engineer role. Your profile looks impressive.', timestamp: '10:30 AM' },
          { id: 'msg2', sender: 'other', text: 'Thank you! I am very interested in the position.', timestamp: '10:31 AM' },
          { id: 'msg3', sender: 'me', text: 'Excellent. Would you be available for a brief call tomorrow to discuss your experience further?', timestamp: '10:32 AM' },
          { id: 'msg4', sender: 'other', text: 'That sounds great! I am available to chat tomorrow.', timestamp: '10:33 AM' },
        ],
        pinned: false,
        favourited: true,
        unread: false,
        muted: false,
        timestamp: Date.now() - 1000 * 60 * 10,
      },
      {
        id: 'conv4',
        partnerName: 'Candidate Name',
        partnerRole: 'Candidate',
        jobTitle: 'Senior Backend Engineer',
        lastMessage: 'Thanks for the opportunity!',
        avatar: 'CN',
        messages: [
          { id: 'msg1', sender: 'me', text: 'Hi, we have an opening for a Senior Backend Engineer at TekSystems India. Are you interested?', timestamp: '3 days ago' },
          { id: 'msg2', sender: 'other', text: 'Yes, I am interested. Could you please share more details?', timestamp: '3 days ago' },
          { id: 'msg3', sender: 'me', text: 'Certainly. We are looking for someone with 5+ years of experience in backend development. The job description is attached.', timestamp: '3 days ago' },
          { id: 'msg4', sender: 'other', text: 'Thanks for the opportunity!', timestamp: '2 days ago' },
        ],
        pinned: false,
        favourited: false,
        unread: false,
        muted: false,
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
      {
        id: 'conv2',
        partnerName: 'Rohan Sharma',
        partnerRole: 'Candidate',
        jobTitle: 'Data Scientist',
        lastMessage: 'Yes, I have submitted my resume via the portal.',
        avatar: 'RS',
        messages: [
          { id: 'msg1', sender: 'me', text: 'Hi Rohan, I saw your application for the Data Scientist role. Have you submitted your full resume?', timestamp: 'Yesterday' },
          { id: 'msg2', sender: 'other', text: 'Yes, I have submitted my resume via the portal.', timestamp: 'Yesterday' },
        ],
        pinned: false,
        favourited: false,
        unread: true,
        muted: true,
        timestamp: Date.now() - 1000 * 60 * 60 * 23,
      },
      {
        id: 'conv3',
        partnerName: 'Anjali Menon',
        partnerRole: 'Candidate',
        jobTitle: 'Junior Frontend Developer',
        lastMessage: 'Perfect, looking forward to it.',
        avatar: 'AM',
        messages: [
          { id: 'msg1', sender: 'me', text: 'Hello Anjali, we were impressed with your portfolio and would like to schedule a brief introductory call.', timestamp: '2 days ago' },
          { id: 'msg2', sender: 'other', text: 'Thank you so much! I\'d love that. What time works for you?', timestamp: '2 days ago' },
          { id: 'msg3', sender: 'me', text: 'How about Friday at 2 PM?', timestamp: '2 days ago' },
          { id: 'msg4', sender: 'other', text: 'Perfect, looking forward to it.', timestamp: '2 days ago' },
        ],
        pinned: false,
        favourited: false,
        unread: false,
        muted: false,
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
      }
    ];
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ApplicationNotification[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<ApplicationNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

      const storedHistory = localStorage.getItem(APPLICATION_HISTORY_KEY);
      if (storedHistory) setApplicationHistory(JSON.parse(storedHistory));
       
      const storedConversations = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (storedConversations) {
        setConversations(JSON.parse(storedConversations));
      } else if (user) {
        setConversations(getMockConversations(user.role));
      }

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, [user]);

   useEffect(() => {
        const unsubscribeJobs = onSnapshot(collection(db, "jobs"), (querySnapshot) => {
            const jobsData: Job[] = [];
            querySnapshot.forEach((doc) => {
                jobsData.push({ id: doc.id, ...doc.data() } as Job);
            });
            setJobs(jobsData);
        });

        const unsubscribeCandidates = onSnapshot(collection(db, "candidates"), (querySnapshot) => {
            const candidatesData: Candidate[] = [];
            querySnapshot.forEach((doc) => {
                candidatesData.push({ id: doc.id, ...doc.data() } as Candidate);
            });
            setCandidates(candidatesData);
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribeJobs();
            unsubscribeCandidates();
        };
    }, []);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(APPLICATION_HISTORY_KEY, JSON.stringify(applicationHistory));
  }, [applicationHistory]);

  useEffect(() => {
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);


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
    // This can be used for both notifications and system messages in conversations
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
     setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, unread: false } : c))
    );
  };

  const toggleMute = (id: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, muted: !c.muted } : c))
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
    const existingConvo = conversations.find(c => c.jobTitle === stub.jobTitle && c.partnerName === stub.partnerName);
    if(existingConvo) {
        return existingConvo.id;
    }

    const messages = stub.createEmpty ? [] : [
        { id: `msg-${Date.now()}`, sender: 'me' as const, text: `Hi, I'd like to ask a question about the ${stub.jobTitle} position.`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ];

    const lastMessage = stub.createEmpty ? 'Conversation started.' : messages[0].text;


    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      partnerName: stub.partnerName,
      partnerRole: user?.role === 'user' ? 'Recruiter' : 'Candidate',
      jobTitle: stub.jobTitle,
      lastMessage: lastMessage,
      avatar: stub.partnerName.split(' ').map(n => n[0]).join(''),
      messages: messages,
      pinned: false,
      favourited: false,
      unread: false,
      muted: false,
      timestamp: Date.now(),
    };

    setConversations(prev => [newConversation, ...prev]);
    return newConversation.id;
  }

  const addJob = async (job: Omit<Job, 'id' | 'position'>) => {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newJob: Job = {
        ...job,
        id: tempId,
        position: { lat: 20.5937, lng: 78.9629 } // Default to India center
    };
    setJobs(prevJobs => [newJob, ...prevJobs]);

    try {
        const docRef = await addDoc(collection(db, "jobs"), {
            ...job,
            position: { lat: 20.5937, lng: 78.9629 },
        });
        // Replace temp job with real one from Firestore
        setJobs(prevJobs => prevJobs.map(j => j.id === tempId ? { ...j, id: docRef.id } : j));
    } catch (e) {
        console.error("Error adding document: ", e);
        // Revert optimistic update on error
        setJobs(prevJobs => prevJobs.filter(j => j.id !== tempId));
        throw e; // Re-throw error to be caught in the component
    }
  };

  const deleteJob = async (jobId: string) => {
    // Optimistic update
    const originalJobs = jobs;
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
    
    try {
        await deleteDoc(doc(db, "jobs", jobId));
    } catch (e) {
        console.error("Error deleting document: ", e);
        // Revert optimistic update on error
        setJobs(originalJobs);
        throw e;
    }
  };

  const updateCandidateProfile = async (candidateId: string, profileData: { name: string, profile: string }) => {
    // Optimistic update
    const originalCandidates = candidates;
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, ...profileData } : c));
    
    try {
      await setDoc(doc(db, "candidates", candidateId), profileData, { merge: true });
    } catch (e) {
      console.error("Error updating candidate profile: ", e);
      setCandidates(originalCandidates);
      throw e;
    }
  };


  useEffect(() => {
    if (!user) return;
     const mockConvos = getMockConversations(user?.role || 'user');
     const storedConversationsStr = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
     let storedConversations = storedConversationsStr ? JSON.parse(storedConversationsStr) : mockConvos;
     
    if (user?.role === 'recruiter' || user?.role === 'admin') {
        const newNotifConvos: Conversation[] = notifications
        .filter(notif => !notif.read) // Only show unread notifications as conversations
        .map(notif => ({
            id: notif.id,
            partnerName: 'System Notification',
            partnerRole: 'System',
            jobTitle: notif.jobTitle,
            lastMessage: `New application from ${notif.candidateName}.`,
            avatar: 'Bell',
            messages: [
                { id: `msg-${notif.id}`, sender: 'system', text: `A new candidate, ${notif.candidateName}, has applied for the ${notif.jobTitle} position at ${notif.company}. You can view their profile in the talent pool.`, timestamp: formatDistanceToNow(notif.timestamp) + ' ago' },
            ],
            pinned: true,
            favourited: false,
            unread: !notif.read,
            muted: false,
            timestamp: notif.timestamp,
        }));

        // Combine and remove duplicates
        const combined = [...newNotifConvos, ...storedConversations];
        const uniqueConvos = combined.filter((convo, index, self) =>
            index === self.findIndex((c) => c.id === convo.id)
        );
        setConversations(uniqueConvos);
    } else {
       setConversations(storedConversations);
    }
  }, [notifications, user]);


  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, toggleMute, initiateConversation, applicationHistory, updateApplicationStatus, conversations, setConversations, jobs, addJob, deleteJob, candidates, updateCandidateProfile }}>
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
