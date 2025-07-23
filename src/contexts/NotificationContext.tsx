

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, UserRole } from './AuthContext';
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
  blockedUsers: { id: string, name: string }[];
  unblockUser: (userId: string) => void;
  savedJobs: string[];
  saveJob: (jobId: string) => void;
  unsaveJob: (jobId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = 'jobApplicationNotifications';
const CONVERSATIONS_STORAGE_KEY = 'jobMatchConversations';
const APPLICATION_HISTORY_KEY = 'jobSeekerApplicationHistory';
const BLOCKED_USERS_KEY = 'jobMatchBlockedUsers';
const SAVED_JOBS_KEY = 'jobMatchSavedJobs';


const MOCK_JOBS: Job[] = [
    { id: 'job-1', title: 'Senior Frontend Engineer', company: 'TechGenix', city: 'Bengaluru', position: { lat: 12.9716, lng: 77.5946 }, type: 'Full-time', domain: 'Tech', salary: '₹25-30 LPA', description: 'Seeking a skilled Senior Frontend Engineer with experience in React and Next.js.' },
    { id: 'job-2', title: 'Product Manager', company: 'InnovateHub', city: 'Pune', position: { lat: 18.5204, lng: 73.8567 }, type: 'Full-time', domain: 'Tech', salary: '₹20-28 LPA', description: 'Lead our product team to build next-generation software solutions.' },
    { id: 'job-3', title: 'Data Scientist', company: 'DataWeave', city: 'Hyderabad', position: { lat: 17.3850, lng: 78.4867 }, type: 'Full-time', domain: 'Tech', salary: '₹18-24 LPA', description: 'Analyze large datasets to extract meaningful insights and drive business decisions.' },
    { id: 'job-4', title: 'UI/UX Designer', company: 'CreativeMinds', city: 'Mumbai', position: { lat: 19.0760, lng: 72.8777 }, type: 'Contract', domain: 'Design', salary: '₹15-20 LPA', description: 'Design beautiful and intuitive user interfaces for our mobile and web applications.' },
    { id: 'job-5', title: 'Backend Developer (Python)', company: 'CodeGenius', city: 'Chennai', position: { lat: 13.0827, lng: 80.2707 }, type: 'Full-time', domain: 'Tech', salary: '₹16-22 LPA', description: 'Develop robust backend systems and APIs using Python and Django.' },
    { id: 'job-6', title: 'DevOps Engineer', company: 'InfraCloud', city: 'Bengaluru', position: { lat: 12.9716, lng: 77.5946 }, type: 'Full-time', domain: 'Tech', salary: '₹20-26 LPA', description: 'Manage and scale our cloud infrastructure on AWS and Kubernetes.' },
    { id: 'job-7', title: 'Marketing Manager', company: 'GrowthHackers', city: 'Delhi', position: { lat: 28.7041, lng: 77.1025 }, type: 'Full-time', domain: 'Marketing', salary: '₹12-18 LPA', description: 'Develop and execute marketing campaigns to drive user acquisition.' },
    { id: 'job-8', title: 'Human Resources Generalist', company: 'PeopleFirst', city: 'Noida', position: { lat: 28.5355, lng: 77.3910 }, type: 'Full-time', domain: 'HR', salary: '₹8-12 LPA', description: 'Handle all aspects of HR operations, including recruitment, onboarding, and employee relations.' },
    { id: 'job-9', title: 'Financial Analyst', company: 'FinWise', city: 'Mumbai', position: { lat: 19.0760, lng: 72.8777 }, type: 'Full-time', domain: 'Finance', salary: '₹14-19 LPA', description: 'Provide financial insights and projections to support strategic planning.' },
    { id: 'job-10', title: 'Customer Support Specialist', company: 'HelpDesk Heroes', city: 'Jaipur', position: { lat: 26.9124, lng: 75.7873 }, type: 'Full-time', domain: 'Support', salary: '₹6-9 LPA', description: 'Assist customers with their inquiries and resolve issues promptly and professionally.' },
    { id: 'job-11', title: 'Mobile App Developer (React Native)', company: 'Appify', city: 'Kolkata', position: { lat: 22.5726, lng: 88.3639 }, type: 'Remote', domain: 'Tech', salary: '₹18-25 LPA', description: 'Build cross-platform mobile apps using React Native.' },
    { id: 'job-12', title: 'Cloud Solutions Architect', company: 'SkyHigh', city: 'Bengaluru', position: { lat: 12.9716, lng: 77.5946 }, type: 'Full-time', domain: 'Tech', salary: '₹35-45 LPA', description: 'Design and implement scalable and secure cloud solutions for our enterprise clients.' },
    { id: 'job-13', title: 'Content Writer', company: 'WordSmiths', city: 'Chandigarh', position: { lat: 30.7333, lng: 76.7794 }, type: 'Part-time', domain: 'Content', salary: '₹5-8 LPA', description: 'Create engaging and SEO-friendly content for our blog and social media channels.' },
    { id: 'job-14', title: 'Business Analyst', company: 'BizIntel', city: 'Gurugram', position: { lat: 28.4595, lng: 77.0266 }, type: 'Full-time', domain: 'Business', salary: '₹12-16 LPA', description: 'Bridge the gap between business stakeholders and the technical team to deliver effective solutions.' },
    { id: 'job-15', title: 'Cybersecurity Analyst', company: 'SecureNet', city: 'Pune', position: { lat: 18.5204, lng: 73.8567 }, type: 'Full-time', domain: 'Security', salary: '₹15-22 LPA', description: 'Protect our systems from cyber threats by monitoring, detecting, and responding to incidents.' },
    { id: 'job-16', title: 'Blockchain Developer', company: 'ChainInnovate', city: 'Remote', position: { lat: 20.5937, lng: 78.9629 }, type: 'Full-time', domain: 'Tech', salary: '₹25-35 LPA', description: 'Develop and maintain decentralized applications (dApps) on the Ethereum blockchain.' },
    { id: 'job-17', title: 'Healthcare IT Consultant', company: 'HealthTech', city: 'Chennai', position: { lat: 13.0827, lng: 80.2707 }, type: 'Full-time', domain: 'Healthcare', salary: '₹18-24 LPA', description: 'Advise healthcare organizations on implementing and optimizing their IT systems.' },
    { id: 'job-18', title: 'E-commerce Manager', company: 'Shopify Wizards', city: 'Ahmedabad', position: { lat: 23.0225, lng: 72.5714 }, type: 'Full-time', domain: 'E-commerce', salary: '₹14-20 LPA', description: 'Manage our online store, from product listings to digital marketing and sales.' },
    { id: 'job-19', title: 'AI/ML Engineer', company: 'CogniCore', city: 'Hyderabad', position: { lat: 17.3850, lng: 78.4867 }, type: 'Full-time', domain: 'Tech', salary: '₹22-30 LPA', description: 'Build and deploy machine learning models to solve complex business problems.' },
    { id: 'job-20', title: 'Sales Executive', company: 'DealMakers', city: 'Lucknow', position: { lat: 26.8467, lng: 80.9462 }, type: 'Full-time', domain: 'Sales', salary: '₹7-11 LPA', description: 'Drive sales growth by identifying new leads and closing deals.' },
];

const getMockConversations = (role: 'recruiter' | 'user' | 'admin'): Conversation[] => {
    if (role === 'user') {
      return [
        {
          id: 'conv-user-1',
          partnerName: 'Recruiter @ TechGenix',
          partnerRole: 'Recruiter',
          jobTitle: 'Senior Frontend Engineer',
          lastMessage: 'That sounds great! I am available to chat tomorrow.',
          avatar: 'R@T',
          messages: [
            { id: 'msg1', sender: 'other', text: 'Hi, thanks for your interest in the Senior Frontend Engineer role. Your profile looks impressive.', timestamp: '10:30 AM' },
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
          id: 'conv-user-2',
          partnerName: 'HR @ Google',
          partnerRole: 'Recruiter',
          jobTitle: 'Data Scientist',
          lastMessage: 'Sure, I will share it shortly.',
          avatar: 'HR@G',
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
    // For Recruiter or Admin
    return [
      {
        id: 'conv-recruiter-1',
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
        id: 'conv-recruiter-2',
        partnerName: 'Amit Kumar',
        partnerRole: 'Candidate',
        jobTitle: 'Senior Frontend Engineer',
        lastMessage: 'Thanks for the opportunity!',
        avatar: 'AK',
        messages: [
          { id: 'msg1', sender: 'me', text: 'Hi Amit, I\'m reaching out regarding this opportunity. I was impressed by your profile and would like to discuss this opportunity further.', timestamp: '03:41 PM' },
          { id: 'msg2', sender: 'other', text: 'Thanks for the opportunity!', timestamp: '2 days ago' },
        ],
        pinned: false,
        favourited: false,
        unread: false,
        muted: false,
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
      {
        id: 'conv-recruiter-3',
        partnerName: 'Rajesh Nair',
        partnerRole: 'Candidate',
        jobTitle: 'Data Scientist',
        lastMessage: 'Yes, I have submitted my resume via the portal.',
        avatar: 'RN',
        messages: [
          { id: 'msg1', sender: 'me', text: 'Hi Rajesh, I saw your application for the Data Scientist role. Have you submitted your full resume?', timestamp: 'Yesterday' },
          { id: 'msg2', sender: 'other', text: 'Yes, I have submitted my resume via the portal.', timestamp: 'Yesterday' },
        ],
        pinned: false,
        favourited: false,
        unread: true,
        muted: true,
        timestamp: Date.now() - 1000 * 60 * 60 * 23,
      },
    ];
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ApplicationNotification[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<ApplicationNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<{ id: string, name: string }[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // This effect runs once on mount to load initial data from localStorage.
    try {
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

      const storedHistory = localStorage.getItem(APPLICATION_HISTORY_KEY);
      if (storedHistory) setApplicationHistory(JSON.parse(storedHistory));
       
      const storedBlocked = localStorage.getItem(BLOCKED_USERS_KEY);
      if (storedBlocked) setBlockedUsers(JSON.parse(storedBlocked));

      const storedSavedJobs = localStorage.getItem(SAVED_JOBS_KEY);
      if (storedSavedJobs) setSavedJobs(JSON.parse(storedSavedJobs));
      
      const storedConversations = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (user) {
        setConversations(storedConversations ? JSON.parse(storedConversations) : getMockConversations(user.role));
      } else {
        setConversations([]);
      }

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, [user]);

   useEffect(() => {
        // This effect syncs data with Firestore
        const unsubscribeJobs = onSnapshot(collection(db, "jobs"), (querySnapshot) => {
            const jobsData: Job[] = [];
            querySnapshot.forEach((doc) => {
                jobsData.push({ id: doc.id, ...doc.data() } as Job);
            });
            // Combine mock data with firestore data, giving preference to firestore
             const combinedJobs = [...MOCK_JOBS, ...jobsData];
             const uniqueJobs = combinedJobs.filter((job, index, self) => index === self.findIndex((j) => j.id === job.id || j.title === job.title));
             setJobs(uniqueJobs);
        });

        const unsubscribeCandidates = onSnapshot(collection(db, "candidates"), (querySnapshot) => {
            const candidatesData: Candidate[] = [];
            querySnapshot.forEach((doc) => {
                candidatesData.push({ id: doc.id, ...doc.data() } as Candidate);
            });
            setCandidates(candidatesData);
        });

        return () => {
            unsubscribeJobs();
            unsubscribeCandidates();
        };
    }, []);

  // These effects save data back to localStorage whenever it changes.
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(APPLICATION_HISTORY_KEY, JSON.stringify(applicationHistory));
  }, [applicationHistory]);

  useEffect(() => {
    if(user) {
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations, user]);

  useEffect(() => {
    localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
  }, [blockedUsers]);
  
  useEffect(() => {
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(savedJobs));
  }, [savedJobs]);

  const saveJob = (jobId: string) => {
    setSavedJobs(prev => [...new Set([...prev, jobId])]);
  };
  
  const unsaveJob = (jobId: string) => {
    setSavedJobs(prev => prev.filter(id => id !== jobId));
  };


  const addNotification = (jobTitle: string, company: string) => {
    const candidateId = user?.id || `cand-anon-${Math.floor(Math.random() * 1000)}`;
    const newApplication: ApplicationNotification = {
      id: `app-${Date.now()}`,
      jobTitle,
      company,
      candidateName: candidates.find(c => c.id === candidateId)?.name || 'A Job Seeker',
      timestamp: Date.now(),
      read: false,
      status: 'Applied',
      candidateId: candidateId,
    };
    
    setNotifications(prev => [newApplication, ...prev]);
    setApplicationHistory(prev => [newApplication, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
     setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread: false } : c)));
  };

  const toggleMute = (id: string) => {
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, muted: !c.muted } : c)));
  };
  
  const updateApplicationStatus = (candidateId: string, status: ApplicationNotification['status']) => {
    setApplicationHistory(prev => prev.map(app => (app.candidateId === candidateId ? { ...app, status } : app)));
  };

  const initiateConversation = (stub: ConversationStub): string => {
    const existingConvo = conversations.find(c => c.jobTitle === stub.jobTitle && c.partnerName === stub.partnerName);
    if(existingConvo) {
        return existingConvo.id;
    }

    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      partnerName: stub.partnerName,
      partnerRole: user?.role === 'user' ? 'Recruiter' : 'Candidate',
      jobTitle: stub.jobTitle,
      lastMessage: 'Conversation started.',
      avatar: stub.partnerName.split(' ').map(n => n[0]).join(''),
      messages: [],
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
        setJobs(prevJobs => prevJobs.map(j => j.id === tempId ? { ...j, id: docRef.id } : j));
    } catch (e) {
        console.error("Error adding document: ", e);
        setJobs(prevJobs => prevJobs.filter(j => j.id !== tempId));
        throw e;
    }
  };

  const deleteJob = async (jobId: string) => {
    const originalJobs = jobs;
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
    
    try {
        await deleteDoc(doc(db, "jobs", jobId));
    } catch (e) {
        console.error("Error deleting document: ", e);
        setJobs(originalJobs);
        throw e;
    }
  };

  const updateCandidateProfile = async (candidateId: string, profileData: { name: string, profile: string }) => {
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

  const unblockUser = (userId: string) => {
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
  }


  useEffect(() => {
    if (!user) return;
    
    if (user.role === 'recruiter' || user.role === 'admin') {
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
                { id: `msg-${notif.id}`, sender: 'system', text: `A new candidate, ${notif.candidateName}, has applied for the ${notif.JobTitle} position at ${notif.company}. You can view their profile in the talent pool.`, timestamp: formatDistanceToNow(notif.timestamp) + ' ago' },
            ],
            pinned: true,
            favourited: false,
            unread: !notif.read,
            muted: false,
            timestamp: notif.timestamp,
        }));

        // Combine and remove duplicates
        const combined = [...newNotifConvos, ...conversations];
        const uniqueConvos = combined.filter((convo, index, self) =>
            index === self.findIndex((c) => c.id === convo.id)
        );
        setConversations(uniqueConvos);
    }
  }, [notifications, user]);


  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, toggleMute, initiateConversation, applicationHistory, updateApplicationStatus, conversations, setConversations, jobs, addJob, deleteJob, candidates, updateCandidateProfile, blockedUsers, unblockUser, savedJobs, saveJob, unsaveJob }}>
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
