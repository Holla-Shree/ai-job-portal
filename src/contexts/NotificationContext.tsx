

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, query, where, getDocs, writeBatch, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

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
  company?: string;
  candidateName?: string;
}

export interface ApplicationNotification {
  id: string;
  jobTitle: string;
  company: string;
  candidateName: string; 
  timestamp: number;
  read: boolean;
  status: 'Interested' | 'Applied' | 'Under Review' | 'Interview' | 'Offer' | 'Rejected';
  candidateId?: string;
}

interface NotificationContextType {
  notifications: ApplicationNotification[];
  addNotification: (jobTitle: string, company: string) => void;
  expressInterest: (jobTitle: string, company: string) => void;
  markAsRead: (id: string) => void;
  toggleMute: (id: string) => void;
  applicationHistory: ApplicationNotification[];
  updateApplicationStatus: (candidateId: string, status: ApplicationNotification['status']) => void;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearConversationMessages: (conversationId: string) => Promise<void>;
  jobs: Job[];
  addJob: (job: Job) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  candidates: Candidate[];
  updateCandidateProfile: (candidateId: string, profileData: Partial<Candidate>) => Promise<void>;
  blockedUsers: { id: string, name: string }[];
  unblockUser: (userId: string) => void;
  saveJob: (job: Job) => void;
  unsaveJob: (jobId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const BLOCKED_USERS_KEY = 'jobMatchBlockedUsers';

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
    resumeFilename?: string | null;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ApplicationNotification[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<ApplicationNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<{ id: string, name: string }[]>([]);
  const { user, setUser } = useAuth();


  useEffect(() => {
    // This effect runs only on the client
    if (typeof window !== 'undefined') {
      try {
        const storedBlocked = localStorage.getItem(BLOCKED_USERS_KEY);
        if (storedBlocked) setBlockedUsers(JSON.parse(storedBlocked));
      } catch (error) {
        console.error("Failed to load data from localStorage", error);
      }
    }
  }, []);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !user || !user.id) {
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
    
    const candidatesCollectionRef = collection(db, "candidates");
    const unsubscribeCandidates = onSnapshot(candidatesCollectionRef, (snapshot) => {
        const candidatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
        setCandidates(candidatesData);

        if (user) {
            const currentUserData = candidatesData.find(c => c.id === user.id);
            if (currentUserData) {
                setUser(prevUser => {
                    if (!prevUser) return null;
                    const updatedUser = {
                        ...prevUser,
                        name: currentUserData.name,
                    };
                     if (JSON.stringify(prevUser) !== JSON.stringify(updatedUser)) {
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        return updatedUser;
                    }
                    return prevUser;
                });
            }
        }
    });

    const conversationsQuery = query(collection(db, "conversations"), where("participants", "array-contains", user.id), orderBy("timestamp", "desc"));
    const unsubscribeConversations = onSnapshot(conversationsQuery, (querySnapshot) => {
        const convosData: Conversation[] = [];
         querySnapshot.forEach(doc => {
            const data = doc.data();
            const partnerRole = user.role === 'user' ? 'Recruiter' : 'Candidate';
            
            let partnerName = 'A partner';
            if (user.role === 'user') {
                partnerName = `Recruiter @ ${data.company || 'a company'}`;
            } else if (user.role === 'recruiter') {
                partnerName = data.candidateName || 'A candidate';
            }


            convosData.push({
                id: doc.id,
                ...data,
                partnerName: partnerName,
                partnerRole: data.partnerRole || partnerRole,
                avatar: partnerRole.charAt(0),
            } as Conversation);
        });

        // This replaces the entire state, ensuring deleted items are removed
        setConversations(convosData);
    });

    const applicationsQuery = user.role === 'user' 
        ? query(collection(db, "applications"), where("candidateId", "==", user.id))
        : collection(db, "applications");

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
  }, [user, setUser]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
    }
  }, [blockedUsers]);
  

  const saveJob = async (job: Job) => {
      if (!user?.id) return;
      
      // The `expressInterest` function is now the correct way to "save" a job
      // as it adds it to the "Interested" column of the pipeline.
      await expressInterest(job.title, job.company);
  };
  
  const unsaveJob = async (jobId: string) => {
    if (!user || user.role !== 'user') return;
     const jobDetails = jobs.find(j => j.id === jobId);
     if (!jobDetails) return;

     const appToDelete = applicationHistory.find(app => 
        app.candidateId === user.id &&
        app.jobTitle === jobDetails.title &&
        app.company === jobDetails.company &&
        app.status === 'Interested'
     );

    if (appToDelete) {
        try {
            await deleteDoc(doc(db, "applications", appToDelete.id));
        } catch (e) {
            console.error("Error removing 'Interested' application: ", e);
        }
    }
  };


  const addNotification = async (jobTitle: string, company: string) => {
    if (!user?.id) return;
    const candidateId = user.id;

    // Check if an application for this job already exists
    const q = query(
        collection(db, 'applications'), 
        where("candidateId", "==", candidateId),
        where("jobTitle", "==", jobTitle),
        where("company", "==", company),
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Application exists, update its status to 'Applied'
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { status: 'Applied', timestamp: Date.now() });
    } else {
        // No application exists, create a new one with 'Applied' status
        const candidate = candidates.find(c => c.id === candidateId);
        const newApplication = {
          jobTitle,
          company,
          candidateName: candidate?.name || user.name || 'A Job Seeker',
          timestamp: Date.now(),
          read: false,
          status: 'Applied' as const,
          candidateId: candidateId,
        };
        await addDoc(collection(db, 'applications'), newApplication);
    }
  };

  const expressInterest = async (jobTitle: string, company: string) => {
    if (!user?.id) return;
    const candidateId = user.id;

    // Check if an entry for this job already exists for this user
    const q = query(
        collection(db, 'applications'), 
        where("candidateId", "==", candidateId),
        where("jobTitle", "==", jobTitle),
        where("company", "==", company),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // Only create a new "Interested" record if one doesn't exist
        const candidate = candidates.find(c => c.id === candidateId);
        const newInterest = {
          jobTitle,
          company,
          candidateName: candidate?.name || user.name || 'A Job Seeker',
          timestamp: Date.now(),
          read: false,
          status: 'Interested' as const,
          candidateId: candidateId,
        };
        await addDoc(collection(db, 'applications'), newInterest);
    }
    // If a record already exists (e.g., they are already interested or applied), do nothing.
  };

  const markAsRead = async (id: string) => {
    if(!user?.id) return;
    
    const convoRef = doc(db, "conversations", id);
    try {
      await updateDoc(convoRef, { 
        unreadBy: arrayRemove(user.id)
      });
    } catch(e) {
      console.error("Error marking as read: ", e);
    }
  };

  const toggleMute = async (id: string) => {
    if(!user?.id) return;
    const convo = conversations.find(c => c.id === id);
    if (!convo) return;
    
    const muted = convo.mutedBy.includes(user.id);
    const newMutedBy = muted ? arrayRemove(user.id) : arrayUnion(user.id);

    try {
        await updateDoc(doc(db, "conversations", id), { mutedBy: newMutedBy });
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
  

  const addJob = async (job: Job) => {
    // Add to local state immediately for optimistic UI
    setJobs(prevJobs => [...prevJobs, job]);
    
    // Add to Firestore in the background
    try {
        const { id, ...jobData } = job; // Exclude temporary id
        await addDoc(collection(db, "jobs"), jobData);
    } catch (e) {
        console.error("Error adding document: ", e);
        // Revert local state if Firestore write fails
        setJobs(prevJobs => prevJobs.filter(j => j.id !== job.id));
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
  
  const deleteConversation = async (conversationId: string) => {
    try {
        await deleteDoc(doc(db, "conversations", conversationId));
    } catch (e) {
        console.error("Error deleting conversation: ", e);
        throw e;
    }
  };

  const clearConversationMessages = async (conversationId: string) => {
    try {
        const convoRef = doc(db, "conversations", conversationId);
        await updateDoc(convoRef, { messages: [], lastMessage: "Chat cleared." });
    } catch (e) {
        console.error("Error clearing messages: ", e);
        throw e;
    }
  };


  const updateCandidateProfile = async (candidateId: string, profileData: Partial<Candidate>) => {
    try {
      const docRef = doc(db, "candidates", candidateId);
      await setDoc(docRef, profileData, { merge: true });
    } catch (e) {
      console.error("Error updating candidate profile: ", e);
      throw e;
    }
  };


  const unblockUser = (userId: string) => {
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
  }

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, expressInterest, markAsRead, toggleMute, applicationHistory, updateApplicationStatus, conversations, setConversations, deleteConversation, clearConversationMessages, jobs, addJob, deleteJob, candidates, updateCandidateProfile, blockedUsers, unblockUser, saveJob, unsaveJob }}>
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
