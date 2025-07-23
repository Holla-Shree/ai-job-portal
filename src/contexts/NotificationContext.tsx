

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { collection, addDoc, getDocs, onSnapshot } from "firebase/firestore"; 
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
  candidates: Candidate[];
  addCandidate: (candidate: Omit<Candidate, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = 'jobApplicationNotifications';
const CONVERSATIONS_STORAGE_KEY = 'jobMatchConversations';
const APPLICATION_HISTORY_KEY = 'jobSeekerApplicationHistory';
const CANDIDATES_STORAGE_KEY = 'jobMatchCandidates';

const MOCK_CANDIDATES = [
    { id: 'cand1', name: 'Priya Patel', profile: 'Experienced Full Stack Developer with 5 years in React and Node.js. Led a team to build a high-traffic e-commerce platform. Skilled in AWS, Docker, and PostgreSQL. B.Sc. in Computer Science from IIT Bombay.' },
    { id: 'cand2', name: 'Rohan Sharma', profile: 'Senior Backend Engineer specializing in Python, Django, and microservices architecture. 8+ years of experience building scalable financial systems. Proficient with Kubernetes and GCP. Master\'s in Software Engineering from BITS Pilani.' },
    { id: 'cand3', name: 'Anjali Menon', profile: 'Junior Frontend Developer with 1 year of experience. Strong skills in HTML, CSS, JavaScript, and React. Passionate about creating beautiful user interfaces. Completed a 6-month coding bootcamp from UpGrad.' },
    { id: 'cand4', name: 'Vikram Singh', profile: 'DevOps Engineer with 4 years of experience in CI/CD pipelines using Jenkins and GitLab. Certified Kubernetes Administrator. Expertise in Terraform and Ansible for infrastructure as code. Based in Pune.' },
    { id: 'cand5', name: 'Sneha Reddy', profile: 'Data Scientist with 3 years of experience in machine learning and predictive modeling. Proficient in Python, Scikit-learn, and TensorFlow. Experience with data visualization tools like Tableau. From Hyderabad.' },
    { id: 'cand6', name: 'Amit Kumar', profile: 'Product Manager with 6 years of experience in the SaaS industry. Proven track record of launching successful B2B products. Strong analytical skills and experience with Agile methodologies. MBA from IIM Ahmedabad.' },
    { id: 'cand7', name: 'Neha Gupta', profile: 'UX/UI Designer with a focus on mobile applications. 5 years of experience creating intuitive and user-friendly designs for iOS and Android. Proficient in Figma, Sketch, and Adobe Creative Suite. Portfolio available upon request.' },
    { id: 'cand8', name: 'Karan Malhotra', profile: 'Cybersecurity Analyst with 7 years of experience in threat detection and incident response. Certified Information Systems Security Professional (CISSP). Experience with SIEM tools like Splunk. Based in Delhi.' },
    { id: 'cand9', name: 'Isha Nair', profile: 'Digital Marketing Manager with a decade of experience in SEO, SEM, and social media marketing. Successfully managed multi-million dollar ad budgets. Google Ads certified. Currently located in Mumbai.' },
    { id: 'cand10', name: 'Rajesh Kumar', profile: 'Mobile App Developer with expertise in Flutter. 4 years of experience building cross-platform applications for startups. Published several apps on the Play Store and App Store.' },
    { id: 'cand11', name: 'Deepika Rao', profile: 'QA Automation Engineer with 5 years of experience. Expertise in building testing frameworks from scratch using Selenium and Cypress. Strong understanding of software development life cycle. From Bengaluru.' },
    { id: 'cand12', name: 'Arjun Desai', profile: 'Cloud Solutions Architect with 9 years of experience. AWS Certified Solutions Architect – Professional. Specializes in designing and implementing scalable and cost-effective cloud infrastructure for enterprises.' },
    { id: 'cand13', name: 'Sunita Joshi', profile: 'HR Business Partner with 8 years of experience in the tech industry. Expertise in talent acquisition, employee relations, and performance management. SHRM-CP certified.' },
    { id: 'cand14', name: 'Manish Verma', profile: 'Data Engineer with 4 years of experience building and maintaining ETL pipelines. Proficient in Apache Spark, Kafka, and Airflow. Experience with big data technologies on AWS.' },
    { id: 'cand15', name: 'Pooja Agarwal', profile: 'Business Analyst with a background in finance. 6 years of experience translating business requirements into technical specifications for fintech products. Based in Gurugram.' },
    { id: 'cand16', name: 'Siddharth Chatterjee', profile: 'Content Strategist and Writer with 7 years of experience creating engaging content for B2B tech companies. Expertise in long-form blog posts, white papers, and case studies. From Kolkata.' },
    { id: 'cand17', name: 'Aditi Sharma', profile: 'Salesforce Developer with 3 years of experience. Certified Salesforce Platform Developer I. Experience in Apex, Visualforce, and Lightning Web Components. Based in Noida.' },
    { id: 'cand18', name: 'Vivek Iyer', profile: 'Senior Java Developer with 10 years of experience in building enterprise-grade applications using Spring Boot and Hibernate. Strong understanding of microservices and RESTful APIs. From Chennai.' },
    { id: 'cand19', name: 'Fatima Khan', profile: 'Scrum Master with 5 years of experience facilitating agile ceremonies for multiple development teams. Certified ScrumMaster (CSM). Passionate about improving team velocity and productivity.' },
    { id: 'cand20', name: 'Nikhil Reddy', profile: 'AI/ML Engineer with 2 years of experience post-Master\'s. Researched and implemented computer vision models using PyTorch. Strong mathematical and statistical background. Graduated from IISc Bangalore.' },
    { id: 'fresher1', name: 'Aarav Sharma', profile: 'Recent B.Tech Computer Science graduate from VIT Vellore (CGPA: 8.5/10). No professional experience. Skilled in Java, Python, and SQL. Developed a "Library Management System" as a final year project using Java Swing and MySQL. Seeking an entry-level software developer role.' },
    { id: 'fresher2', name: 'Meera Desai', profile: 'Fresh MBA graduate with a specialization in Marketing from NMIMS, Mumbai. Completed a 3-month marketing internship at a local startup, where I assisted with social media campaigns and market research. Proficient in Google Analytics and Mailchimp. Eager to start a career as a Marketing Associate.' },
    { id: 'fresher3', name: 'Rohan Gupta', profile: 'B.Com (Honours) graduate from Delhi University. No work experience. Strong understanding of accounting principles, financial statements, and taxation. Certified in Tally ERP 9 and advanced MS Excel. Looking for a trainee position in an accounting or finance department.' },
    { id: 'fresher4', name: 'Sunita Krishnan', profile: 'Just graduated with a Bachelor of Design (B.Des) in Graphic Design from NID Ahmedabad. No industry experience. Portfolio includes branding projects, illustration, and UI mockups for mobile apps created for academic assignments. Skilled in Adobe Creative Suite (Photoshop, Illustrator, InDesign). Seeking a Junior Graphic Designer role.' },
];


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

      const storedCandidates = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      if (storedCandidates) {
        setCandidates(JSON.parse(storedCandidates));
      } else {
        setCandidates(MOCK_CANDIDATES);
      }

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, [user]);

   useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "jobs"), (querySnapshot) => {
            const jobsData: Job[] = [];
            querySnapshot.forEach((doc) => {
                jobsData.push({ id: doc.id, ...doc.data() } as Job);
            });
            setJobs(jobsData);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
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

  useEffect(() => {
    localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(candidates));
  }, [candidates]);


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
    try {
        await addDoc(collection(db, "jobs"), {
            ...job,
            position: { lat: 20.5937, lng: 78.9629 }, // Default to India center
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
  };

  const addCandidate = (candidate: Omit<Candidate, 'id'>) => {
      const newCandidate: Candidate = {
          ...candidate,
          id: `cand-${Date.now()}`,
      };
      setCandidates(prev => [newCandidate, ...prev]);
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
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, toggleMute, initiateConversation, applicationHistory, updateApplicationStatus, conversations, setConversations, jobs, addJob, candidates, addCandidate }}>
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
