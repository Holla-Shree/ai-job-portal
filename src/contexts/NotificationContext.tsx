

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, query, where, getDocs, writeBatch, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from '@/lib/firebase';

export interface Message {
  id: string;
  sender: 'me' | 'other' | 'system';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // [userId, recruiterId]
  jobTitle: string;
  lastMessage: string;
  messages: Message[];
  pinned: boolean;
  favourited: boolean;
  unreadBy: string[];
  mutedBy: string[];
  timestamp: number;
  // For UI display
  partnerName: string;
  partnerRole: 'Recruiter' | 'Candidate' | 'System';
  avatar: string;
}

export interface ApplicationNotification {
  id: string;
  jobTitle: string;
  company: string;
  candidateName: string; 
  timestamp: number;
  read: boolean;
  status: 'Applied' | 'Under Review' | 'Interview' | 'Rejected' | 'Offer';
  candidateId?: string;
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
    savedJobs?: string[];
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
  updateCandidateProfile: (candidateId: string, profileData: Partial<Candidate>) => Promise<void>;
  blockedUsers: { id: string, name: string }[];
  unblockUser: (userId: string) => void;
  saveJob: (jobId: string) => void;
  unsaveJob: (jobId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const BLOCKED_USERS_KEY = 'jobMatchBlockedUsers';

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ApplicationNotification[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<ApplicationNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<{ id: string, name: string }[]>([]);
  const { user, setUser } = useAuth();

  useEffect(() => {
    try {
      const storedBlocked = localStorage.getItem(BLOCKED_USERS_KEY);
      if (storedBlocked) setBlockedUsers(JSON.parse(storedBlocked));
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);
  
  useEffect(() => {
    if (!user || !user.id) {
        setJobs([]);
        setCandidates([]);
        setConversations([]);
        setApplicationHistory([]);
        return;
    };

    const unsubscribeJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
        const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(jobsData);
    });

    const unsubscribeCandidates = onSnapshot(collection(db, "candidates"), (snapshot) => {
        const candidatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
        setCandidates(candidatesData);
    });

    const conversationsQuery = query(collection(db, "conversations"), where("participants", "array-contains", user.id));
    const unsubscribeConversations = onSnapshot(conversationsQuery, (snapshot) => {
        const convosData = snapshot.docs.map(doc => {
            const data = doc.data();
            const partnerRole = user.role === 'user' ? 'Recruiter' : 'Candidate';
             // A more robust system would fetch partner profiles, here we use placeholder logic
            const partnerIsRecruiter = user.role === 'user';
            const partnerName = partnerIsRecruiter ? `Recruiter @ ${data.company || 'a company'}` : data.candidateName || 'A candidate';

            return {
                id: doc.id,
                ...data,
                partnerName: partnerName,
                partnerRole: partnerRole,
                avatar: partnerRole.charAt(0),
            } as Conversation
        });
        setConversations(convosData);
    });

    const applicationsQuery = user.role === 'user' 
        ? query(collection(db, "applications"), where("candidateId", "==", user.id))
        : collection(db, "applications"); // Recruiters/Admins see all

    const unsubscribeApplications = onSnapshot(applicationsQuery, (snapshot) => {
        const appsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApplicationNotification));
        setApplicationHistory(appsData);
    });


    return () => {
        unsubscribeJobs();
        unsubscribeCandidates();
        unsubscribeConversations();
        unsubscribeApplications();
    };
}, [user]);


  useEffect(() => {
    localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
  }, [blockedUsers]);
  

  const saveJob = async (jobId: string) => {
    if (!user || user.role !== 'user') return;
    const userDocRef = doc(db, 'candidates', user.id);
    try {
        await updateDoc(userDocRef, {
            savedJobs: arrayUnion(jobId)
        });
        setUser(prev => prev ? ({ ...prev, savedJobs: [...prev.savedJobs, jobId] }) : null);
    } catch (e) {
        console.error("Error saving job: ", e);
    }
  };
  
  const unsaveJob = async (jobId: string) => {
    if (!user || user.role !== 'user') return;
     const userDocRef = doc(db, 'candidates', user.id);
    try {
        await updateDoc(userDocRef, {
            savedJobs: arrayRemove(jobId)
        });
        setUser(prev => prev ? ({ ...prev, savedJobs: prev.savedJobs.filter(id => id !== jobId) }) : null);
    } catch (e) {
        console.error("Error unsaving job: ", e);
    }
  };


  const addNotification = async (jobTitle: string, company: string) => {
    if (!user?.id) return;
    const candidateId = user.id;
    const newApplication = {
      jobTitle,
      company,
      candidateName: candidates.find(c => c.id === candidateId)?.name || 'A Job Seeker',
      timestamp: Date.now(),
      read: false,
      status: 'Applied' as const,
      candidateId: candidateId,
    };
    
    try {
        await addDoc(collection(db, 'applications'), newApplication);
    } catch (error) {
        console.error("Error adding application: ", error);
    }
  };

  const markAsRead = async (id: string) => {
    if(!user?.id) return;
    
    const convoRef = doc(db, "conversations", id);
    try {
      await setDoc(convoRef, { 
        unreadBy: conversations.find(c=>c.id === id)?.unreadBy.filter(uid => uid !== user.id) 
      }, { merge: true });
    } catch(e) {
      console.error("Error marking as read: ", e);
    }
  };

  const toggleMute = async (id: string) => {
    if(!user?.id) return;
    const convo = conversations.find(c => c.id === id);
    if (!convo) return;
    
    const muted = convo.mutedBy.includes(user.id);
    const newMutedBy = muted ? convo.mutedBy.filter(uid => uid !== user.id) : [...convo.mutedBy, user.id];

    try {
        await setDoc(doc(db, "conversations", id), { mutedBy: newMutedBy }, { merge: true });
    } catch(e) {
        console.error("Error toggling mute: ", e);
    }
  };
  
  const updateApplicationStatus = async (candidateId: string, status: ApplicationNotification['status']) => {
    const q = query(collection(db, "applications"), where("candidateId", "==", candidateId));
    try {
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { status: status });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error updating application status: ", error);
    }
  };

  const initiateConversation = (stub: ConversationStub): string => {
    // This function can be simplified as conversations are now handled by Firestore.
    // The logic to find or create a conversation would happen on the messaging page itself.
    // For now, we'll just return a temporary ID and let the page handle the rest.
    const existingConvo = conversations.find(c => c.jobTitle === stub.jobTitle && c.partnerName === stub.partnerName);
    if(existingConvo) {
        return existingConvo.id;
    }
    return `new-${Date.now()}`;
  }

  const addJob = async (job: Omit<Job, 'id' | 'position'>) => {
    try {
        await addDoc(collection(db, "jobs"), {
            ...job,
            // A real app would geocode the location, but we'll use a default for now.
            position: { lat: 20.5937, lng: 78.9629 },
        });
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
        await deleteDoc(doc(db, "jobs", jobId));
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw e;
    }
  };

  const updateCandidateProfile = async (candidateId: string, profileData: Partial<Candidate>) => {
    try {
      await setDoc(doc(db, "candidates", candidateId), profileData, { merge: true });
    } catch (e) {
      console.error("Error updating candidate profile: ", e);
      throw e;
    }
  };

  const unblockUser = (userId: string) => {
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
  }

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, toggleMute, initiateConversation, applicationHistory, updateApplicationStatus, conversations, setConversations, jobs, addJob, deleteJob, candidates, updateCandidateProfile, blockedUsers, unblockUser, saveJob, unsaveJob }}>
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
