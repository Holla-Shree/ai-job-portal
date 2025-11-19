

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
  jobId: string;
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
  jobId?: string;
}

interface NotificationContextType {
  notifications: ApplicationNotification[];
  addNotification: (jobTitle: string, company: string) => void;
  expressInterest: (jobTitle: string, company: string) => void;
  markAsRead: (id: string) => void;
  toggleMute: (id: string) => void;
  applicationHistory: ApplicationNotification[];
  setApplicationHistory: React.Dispatch<React.SetStateAction<ApplicationNotification[]>>;
  updateApplicationStatus: (candidateId: string, jobTitle: string, status: ApplicationNotification['status']) => void;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearConversationMessages: (conversationId: string) => Promise<void>;
  findOrCreateConversation: (partnerId: string, jobId: string) => Promise<string | null>;
  jobs: Job[];
  addJob: (job: Omit<Job, 'id'>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  candidates: Candidate[];
  updateCandidateProfile: (candidateId: string, profileData: Partial<Candidate>) => Promise<void>;
  recruiters: Recruiter[];
  updateRecruiterProfile: (recruiterId: string, profileData: Partial<Recruiter>) => Promise<void>;
  admins: Admin[];
  updateAdminProfile: (adminId: string, profileData: Partial<Admin>) => Promise<void>;
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
    recruiterId?: string;
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
    email?: string;
};

// Add a type for Recruiter as well
export type Recruiter = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    companyName?: string;
    companyWebsite?: string;
    companyBio?: string;
}

export type Admin = {
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
  const [admins, setAdmins] = useState<Admin[]>([]);
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

  // Listen for all data collections
  useEffect(() => {
    const unsubJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
        const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(jobsData);
    });
    const unsubCandidates = onSnapshot(collection(db, "candidates"), (snapshot) => {
        const candidatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
        setCandidates(candidatesData);
    });
    const unsubRecruiters = onSnapshot(collection(db, "recruiters"), (snapshot) => {
        const recruitersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recruiter));
        setRecruiters(recruitersData);
    });
    const unsubAdmins = onSnapshot(collection(db, "admins"), (snapshot) => {
        const adminsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
        setAdmins(adminsData);
    });

    return () => {
        unsubJobs();
        unsubCandidates();
        unsubRecruiters();
        unsubAdmins();
    };
  }, []);
  
  useEffect(() => {
    if (!user?.id) {
        setConversations([]);
        return;
    };

    const conversationsQuery = query(collection(db, "conversations"), where("participants", "array-contains", user.id));
    
    const resolvePartner = (partnerId: string, currentUser: User, allCandidates: Candidate[], allRecruiters: Recruiter[]) => {
        if (partnerId === 'SYSTEM') {
            return {
                partnerName: 'System Notifications',
                partnerRole: 'System' as const,
                avatar: 'S',
            };
        }

        let partnerUser: Candidate | Recruiter | null = null;
        let partnerRole: 'Candidate' | 'Recruiter' = 'Candidate';

        if (currentUser.role === 'user') {
            partnerUser = allRecruiters.find(r => r.id === partnerId) || null;
            partnerRole = 'Recruiter';
        } else { // recruiter or admin
            partnerUser = allCandidates.find(c => c.id === partnerId) || null;
            partnerRole = 'Candidate';
        }
        
        if (partnerUser) {
            return {
                partnerName: partnerUser.name || `A ${partnerRole}`,
                partnerRole,
                avatar: partnerUser.avatar || (partnerUser.name ? partnerUser.name.charAt(0) : partnerRole.charAt(0)),
            };
        }
        
        return {
            partnerName: 'A partner',
            partnerRole: 'Candidate' as const,
            avatar: 'P'
        };
    };

    const unsubscribeConversations = onSnapshot(conversationsQuery, (querySnapshot) => {
        const convosData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const partnerId = data.participants.find((p: string) => p !== user.id);
            const partnerInfo = resolvePartner(partnerId, user, candidates, recruiters);
            
            return {
                id: doc.id,
                ...data,
                ...partnerInfo,
            } as Conversation;
        });

        convosData.sort((a,b) => b.timestamp - a.timestamp);
        setConversations(convosData);
    });

    return () => {
        unsubscribeConversations();
    };
  }, [user, candidates, recruiters]);

  // Separate effect to sync user profile data
  useEffect(() => {
    if (!user) return;

    let unsub;
    if (user.role === 'user') {
      unsub = onSnapshot(doc(db, "candidates", user.id), (doc) => {
        if (doc.exists()) {
          const userData = doc.data() as Candidate;
          if (user.name !== userData.name || user.avatar !== userData.avatar) {
            const updatedUser = { ...user, name: userData.name, avatar: userData.avatar || user.avatar };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
      });
    } else if (user.role === 'recruiter') {
        unsub = onSnapshot(doc(db, "recruiters", user.id), (doc) => {
            if (doc.exists()) {
                const userData = doc.data() as Recruiter;
                 if (user.name !== userData.name || user.avatar !== userData.avatar) {
                    const updatedUser = { ...user, name: userData.name, avatar: userData.avatar || user.avatar };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            }
        });
    } else if (user.role === 'admin') {
        unsub = onSnapshot(doc(db, "admins", user.id), (doc) => {
            if (doc.exists()) {
                const userData = doc.data() as Admin;
                 if (user.name !== userData.name || user.avatar !== userData.avatar) {
                    const updatedUser = { ...user, name: userData.name, avatar: userData.avatar || user.avatar };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            }
        });
    }

    return () => {
      if (unsub) unsub();
    };

  }, [user, setUser]);


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
     
     const appQuery = query(collection(db, "applications"), 
        where("candidateId", "==", user.id),
        where("jobId", "==", jobId),
        where("status", "==", 'Interested')
    );
    const appSnapshot = await getDocs(appQuery);
    
    if (!appSnapshot.empty) {
        const appToDeleteId = appSnapshot.docs[0].id;
        try {
            await deleteDoc(doc(db, "applications", appToDeleteId));
        } catch (e) {
            console.error("Error removing 'Interested' application: ", e);
        }
    }
  };


  const addNotification = async (jobTitle: string, company: string) => {
    if (!user?.id) return;
    const candidateId = user.id;
    const job = jobs.find(j => j.title === jobTitle && j.company === company);

    const q = query(
        collection(db, 'applications'), 
        where("candidateId", "==", candidateId),
        where("jobId", "==", job?.id)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { status: 'Applied', timestamp: Date.now() });
    } else {
        const newApplication = {
          jobTitle,
          company,
          candidateName: user.name || 'A Job Seeker',
          timestamp: Date.now(),
          read: false,
          status: 'Applied' as const,
          candidateId: candidateId,
          jobId: job?.id || null
        };
        await addDoc(collection(db, 'applications'), newApplication);
    }
  };

  const expressInterest = async (jobTitle: string, company: string) => {
    if (!user?.id) return;
    const candidateId = user.id;
    const job = jobs.find(j => j.title === jobTitle && j.company === company);

    const q = query(
        collection(db, 'applications'), 
        where("candidateId", "==", candidateId),
        where("jobId", "==", job?.id),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const newInterest: Omit<ApplicationNotification, 'id'> = {
          jobTitle,
          company,
          candidateName: user.name || 'A Job Seeker',
          timestamp: Date.now(),
          read: false,
          status: 'Interested' as const,
          candidateId: candidateId,
          jobId: job?.id
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
  
  const updateApplicationStatus = async (candidateId: string, jobTitle: string, status: ApplicationNotification['status']) => {
      const q = query(
          collection(db, "applications"),
          where("candidateId", "==", candidateId),
          where("jobTitle", "==", jobTitle)
      );
      try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
              const docRef = querySnapshot.docs[0].ref;
              await updateDoc(docRef, { status: status });
          } else {
              console.warn(`No application found for candidate ${candidateId} and job ${jobTitle} to update.`);
          }
      } catch (error) {
          console.error("Error updating application status: ", error);
      }
  };
  

  const addJob = async (job: Omit<Job, 'id'>) => {
    if (!user) throw new Error("User not authenticated");
    try {
        const docRef = await addDoc(collection(db, "jobs"), {
            ...job,
            recruiterId: user.id, // Ensure recruiterId is set
        });
        await updateDoc(docRef, { id: docRef.id });
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

  const updateRecruiterProfile = async (recruiterId: string, profileData: Partial<Recruiter>) => {
    try {
      const docRef = doc(db, "recruiters", recruiterId);
      await setDoc(docRef, profileData, { merge: true });
    } catch (e) {
      console.error("Error updating recruiter profile: ", e);
      throw e;
    }
  };

  const updateAdminProfile = async (adminId: string, profileData: Partial<Admin>) => {
    try {
      const docRef = doc(db, "admins", adminId);
      await setDoc(docRef, profileData, { merge: true });
    } catch (e) {
      console.error("Error updating admin profile: ", e);
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

  const findOrCreateConversation = async (partnerId: string, jobId: string): Promise<string | null> => {
    if (!user) return null;

    const participants = [user.id, partnerId].sort();
    
    const q = query(
        collection(db, "conversations"),
        where("participants", "==", participants),
        where("jobId", "==", jobId)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Conversation exists
        return querySnapshot.docs[0].id;
    } else {
        // Conversation does not exist, create it
        const job = jobs.find(j => j.id === jobId);
        if (!job) return null;

        const newConversationData = {
            participants: participants,
            jobId: jobId,
            jobTitle: job.title,
            lastMessage: "New conversation started.",
            messages: [],
            pinned: false,
            favourited: false,
            unreadBy: [partnerId],
            mutedBy: [],
            timestamp: Date.now(),
        };
        try {
            const newDocRef = await addDoc(collection(db, "conversations"), newConversationData);
            return newDocRef.id;
        } catch (error) {
            console.error("Error creating new conversation:", error);
            return null;
        }
    }
};

  return (
    <NotificationContext.Provider value={{ 
        notifications, addNotification, expressInterest, markAsRead, toggleMute, 
        applicationHistory, setApplicationHistory, updateApplicationStatus, 
        conversations, setConversations, deleteConversation, clearConversationMessages, findOrCreateConversation,
        jobs, addJob, deleteJob, 
        candidates, updateCandidateProfile, 
        recruiters, updateRecruiterProfile, 
        admins, updateAdminProfile, 
        blockedUsers, unblockUser, saveJob, unsaveJob, sendMessage 
    }}>
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
