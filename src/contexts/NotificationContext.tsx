

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, User } from './AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, query, where, getDocs, writeBatch, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export interface Message {
  id: string;
  senderId: string;
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
  sendMessage: (conversation: Conversation, text: string) => Promise<void>;
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
    avatar?: string;
};

// Add a type for Recruiter as well
export type Recruiter = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ApplicationNotification[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<ApplicationNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
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
    if (!user?.id) {
        setJobs([]);
        setCandidates([]);
        setRecruiters([]);
        setConversations([]);
        setApplicationHistory([]);
        return;
    };

    const unsubscribeJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
        const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(jobsData);
    });
    
    // This listener now handles candidate list updates AND syncs the auth user's profile
    const unsubscribeCandidates = onSnapshot(collection(db, "candidates"), (snapshot) => {
        const candidatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
        setCandidates(candidatesData);

        if (user && user.role === 'user') {
            const currentUserDataFromDb = candidatesData.find(c => c.id === user.id);
            if (currentUserDataFromDb && (user.name !== currentUserDataFromDb.name || user.avatar !== currentUserDataFromDb.avatar)) {
                 const updatedUser = {
                    ...user,
                    name: currentUserDataFromDb.name,
                    avatar: currentUserDataFromDb.avatar || user.avatar,
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        }
    });

    const unsubscribeRecruiters = onSnapshot(collection(db, "recruiters"), (snapshot) => {
        const recruitersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recruiter));
        setRecruiters(recruitersData);

         if (user && user.role === 'recruiter') {
            const currentUserDataFromDb = recruitersData.find(r => r.id === user.id);
            if (currentUserDataFromDb && (user.name !== currentUserDataFromDb.name || user.avatar !== currentUserDataFromDb.avatar)) {
                 const updatedUser = {
                    ...user,
                    name: currentUserDataFromDb.name,
                    avatar: currentUserDataFromDb.avatar || user.avatar,
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        }
    });

    const conversationsQuery = query(collection(db, "conversations"), where("participants", "array-contains", user.id));
    const unsubscribeConversations = onSnapshot(conversationsQuery, (querySnapshot) => {
        const convosDataPromises = querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const partnerId = data.participants.find((p: string) => p !== user.id);
            let partnerName = 'A partner';
            let partnerRole: 'Recruiter' | 'Candidate' | 'System' = 'Candidate';
            let avatar = '';

            if (partnerId) {
                if (partnerId === 'SYSTEM') {
                    partnerName = 'System Notifications';
                    partnerRole = 'System';
                    avatar = 'S';
                } else if (user.role === 'user') {
                    const rec = recruiters.find(r => r.id === partnerId);
                    if(rec) {
                        partnerName = rec.name;
                        avatar = rec.avatar || rec.name.charAt(0);
                    } else {
                        partnerName = "A Recruiter";
                        avatar = "R";
                    }
                    partnerRole = 'Recruiter';
                } else if (user.role === 'recruiter') {
                    const cand = candidates.find(c => c.id === partnerId);
                     if(cand){
                        partnerName = cand.name;
                        avatar = cand.avatar || cand.name.charAt(0);
                     } else {
                        partnerName = "A Candidate";
                        avatar = "C";
                     }

                    partnerRole = 'Candidate';
                }
            }

            return {
                id: doc.id,
                ...data,
                partnerName,
                partnerRole,
                avatar,
            } as Conversation;
        });

        Promise.all(convosDataPromises).then(convosData => {
            convosData.sort((a,b) => b.timestamp - a.timestamp);
            setConversations(convosData);
        });
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
        unsubscribeRecruiters();
        unsubscribeConversations();
        unsubscribeApplications();
    };
  }, [user?.id, user?.role, setUser]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
    }
  }, [blockedUsers]);
  

  const saveJob = async (job: Job) => {
      if (!user?.id) return;
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

    const q = query(
        collection(db, 'applications'), 
        where("candidateId", "==", candidateId),
        where("jobTitle", "==", jobTitle),
        where("company", "==", company),
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { status: 'Applied', timestamp: Date.now() });
    } else {
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

    const q = query(
        collection(db, 'applications'), 
        where("candidateId", "==", candidateId),
        where("jobTitle", "==", jobTitle),
        where("company", "==", company),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
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
    setJobs(prevJobs => [...prevJobs, job]);
    
    try {
        const { id, ...jobData } = job;
        await addDoc(collection(db, "jobs"), jobData);
    } catch (e) {
        console.error("Error adding document: ", e);
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
  
  const sendMessage = async (conversation: Conversation, text: string) => {
    if (!user) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      text,
      timestamp: formatDistanceToNow(new Date(), { addSuffix: true }),
    };

    const conversationRef = doc(db, 'conversations', conversation.id);
    const unreadRecipient = conversation.participants.find(p => p !== user.id);
    const newUnreadBy = unreadRecipient ? [unreadRecipient] : [];

    await updateDoc(conversationRef, {
      messages: arrayUnion(newMessage),
      lastMessage: text,
      timestamp: Date.now(),
      unreadBy: newUnreadBy,
    });
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, expressInterest, markAsRead, toggleMute, applicationHistory, updateApplicationStatus, conversations, setConversations, deleteConversation, clearConversationMessages, jobs, addJob, deleteJob, candidates, updateCandidateProfile, blockedUsers, unblockUser, saveJob, unsaveJob, sendMessage }}>
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
