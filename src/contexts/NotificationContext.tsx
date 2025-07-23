

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
  blockedUsers: { id: string, name: string }[];
  unblockUser: (userId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = 'jobApplicationNotifications';
const CONVERSATIONS_STORAGE_KEY = 'jobMatchConversations';
const APPLICATION_HISTORY_KEY = 'jobSeekerApplicationHistory';
const BLOCKED_USERS_KEY = 'jobMatchBlockedUsers';


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

const MOCK_CANDIDATES: Candidate[] = [
    { id: 'cand-1', name: 'Priya Patel', profile: 'A seasoned software engineer with 8 years of experience in backend development using Python, Django, and AWS. Proven track record of leading teams and delivering scalable microservices.' },
    { id: 'cand-2', name: 'Rohan Sharma', profile: 'A data-driven Product Manager with 5 years of experience in SaaS products. Expertise in user research, roadmap planning, and agile methodologies. Passionate about creating user-centric solutions.' },
    { id: 'cand-3', name: 'Anjali Menon', profile: 'A creative UI/UX Designer with a strong portfolio of mobile and web applications. Proficient in Figma, Sketch, and Adobe Creative Suite. Focuses on creating intuitive and visually appealing user experiences.' },
    { id: 'cand-4', name: 'Vikram Singh', profile: 'A certified DevOps Engineer with expertise in CI/CD pipelines, Kubernetes, and Terraform. Experienced in automating and scaling cloud infrastructure on AWS and GCP.' },
    { id: 'cand-5', name: 'Sneha Reddy', profile: 'A results-oriented Marketing Manager with a knack for digital marketing and growth hacking. Skilled in SEO, SEM, content marketing, and social media campaigns.' },
    { id: 'cand-6', name: 'Amit Kumar', profile: 'A recent computer science graduate with a strong foundation in data structures, algorithms, and web development. Eager to learn and contribute to a challenging frontend role. Projects in React and Vue.js.' },
    { id: 'cand-7', name: 'Neha Gupta', profile: 'A Data Scientist with 4 years of experience in building machine learning models for predictive analytics. Proficient in Python, scikit-learn, and TensorFlow.' },
    { id: 'cand-8', name: 'Karan Malhotra', profile: 'A strategic Financial Analyst with experience in financial modeling, forecasting, and variance analysis. Strong analytical skills and proficiency in Excel and SQL.' },
    { id: 'cand-9', name: 'Isha Desai', profile: 'An empathetic Customer Support Specialist with a talent for problem-solving and communication. Dedicated to providing excellent customer service.' },
    { id: 'cand-10', name: 'Rajesh Nair', profile: 'A full-stack developer with 6 years of experience building applications with the MERN stack (MongoDB, Express, React, Node.js). Comfortable working on both frontend and backend.' },
    { id: 'cand-11', name: 'Sunita Joshi', profile: 'A detail-oriented HR Generalist with experience in the complete employee lifecycle, from recruitment and onboarding to performance management and employee engagement.' },
    { id: 'cand-12', name: 'Arjun Mehta', profile: 'A cybersecurity professional with CISSP certification and experience in threat detection, incident response, and vulnerability management.' },
    { id: 'cand-13', name: 'Pooja Rao', profile: 'A Business Analyst with a strong ability to translate business requirements into technical specifications. Experienced in working with agile development teams.' },
    { id: 'cand-14', name: 'Siddharth Verma', profile: 'A passionate Mobile App Developer with 3 years of experience in building native Android and iOS applications. Skilled in Kotlin, Swift, and React Native.' },
    { id: 'cand-15', name: 'Divya Iyer', profile: 'A creative Content Writer with a portfolio of articles, blog posts, and website copy. Specializes in creating engaging content for the tech industry.' },
    { id: 'cand-16', name: 'Aditya Prasad', profile: 'An AWS Certified Solutions Architect with a deep understanding of cloud computing principles and best practices. Experienced in designing and migrating complex systems to the cloud.' },
    { id: 'cand-17', name: 'Meera Krishnan', profile: 'An experienced E-commerce Manager with a track record of growing online sales through Shopify and other platforms. Skilled in digital advertising and conversion rate optimization.' },
    { id: 'cand-18', name: 'Vivek Iyer', profile: 'A Blockchain Developer with hands-on experience in smart contract development using Solidity and Web3.js. Contributed to several DeFi projects.' },
    { id: 'cand-19', name: 'Fatima Khan', profile: 'An AI/ML Engineer specializing in Natural Language Processing (NLP). Experience with transformer models like BERT and GPT for text classification and generation tasks.' },
    { id: 'cand-20', name: 'Gaurav Singhania', profile: 'A dynamic Sales Executive with a proven ability to exceed sales targets in the B2B SaaS space. Excellent negotiation and relationship-building skills.' },
    { id: 'cand-21', name: 'Harish Chandra', profile: 'Junior Python Developer with a passion for automation and scripting. Interned at a startup where I built internal tools to improve developer productivity. Skills: Python, Flask, SQL.' },
    { id: 'cand-22', name: 'Lakshmi Menon', profile: 'Experienced Quality Assurance Engineer with expertise in manual and automated testing. Proficient with Selenium, Cypress, and Jira for bug tracking.' },
    { id: 'cand-23', name: 'Manoj Tiwari', profile: 'Senior Java Developer with 10+ years of experience in building enterprise-grade applications using Spring Boot and Microservices architecture. Strong knowledge of object-oriented design principles.' },
    { id: 'cand-24', name: 'Nandini Das', profile: 'Graphic Designer with a flair for branding and illustration. Skilled in Adobe Illustrator and Photoshop. Created brand identities for several startups.' },
    { id: 'cand-25', name: 'Omkar Nath', profile: 'Network Engineer with CCNA certification. Experienced in configuring and managing routers, switches, and firewalls in a corporate environment.' },
    { id: 'cand-26', name: 'Parul Agrawal', profile: 'Digital Marketing Specialist with a focus on paid advertising. Manages large budgets on Google Ads and Facebook Ads to generate leads and ROI.' },
    { id: 'cand-27', name: 'Qasim Ahmed', profile: 'Database Administrator (DBA) with experience in managing MySQL and PostgreSQL databases. Skilled in performance tuning, backup, and recovery.' },
    { id: 'cand-28', name: 'Ritu Soni', profile: 'Technical Recruiter with 5 years of experience sourcing and hiring top talent for tech roles, from software engineers to product managers.' },
    { id: 'cand-29', name: 'Sanjay Reddy', profile: 'Scrum Master with CSM certification, facilitating agile ceremonies and helping teams to improve their processes and deliver value faster.' },
    { id: 'cand-30', name: 'Tanvi Shah', profile: 'Healthcare IT professional with experience in implementing Electronic Health Record (EHR) systems. Understands HIPAA compliance and clinical workflows.' },
    { id: 'cand-31', name: 'Uday Kiran', profile: 'Game Developer with a passion for creating immersive experiences in Unity and C#. Developed and published two indie games on the App Store.' },
    { id: 'cand-32', name: 'Varsha Patil', profile: 'IT Project Manager (PMP certified) with a history of successfully delivering complex software projects on time and within budget.' },
    { id: 'cand-33', name: 'Wasim Khan', profile: 'Mechanical Engineer with experience in CAD modeling using SolidWorks and AutoCAD. Worked on product design for consumer electronics.' },
    { id: 'cand-34', name: 'Yamini Sharma', profile: 'Legal Counsel specializing in corporate law and compliance. Advised companies on contract negotiations and intellectual property matters.' },
    { id: 'cand-35', name: 'Zoya Akhtar', profile: 'Video Editor and Motion Graphics artist proficient in Adobe Premiere Pro and After Effects. Created promotional videos and animations for various brands.' },
    { id: 'cand-36', name: 'Alok Nath', profile: 'A Ruby on Rails developer with 4 years of experience. Passionate about writing clean and maintainable code. Contributor to open-source projects.' },
    { id: 'cand-37', name: 'Bhavna Chauhan', profile: 'An agronomist with a Master\'s degree in Soil Science. Research experience in sustainable agriculture and crop management techniques.' },
    { id: 'cand-38', name: 'Chetan Bhagat', profile: 'Not the author, but an aspiring one. Currently working as a technical writer, creating clear and concise documentation for software products.' },
    { id: 'cand-39', name: 'Deepika Singh', profile: 'A dedicated primary school teacher with a passion for making learning fun and engaging for young children. Experience with Montessori methods.' },
    { id: 'cand-40', name: 'Eshaan Verma', profile: 'A civil engineer specializing in structural design and analysis. Proficient in STAAD.Pro and ETABS. Worked on commercial and residential building projects.' },
    { id: 'cand-41', name: 'Feroz Shah', profile: 'An architect with a focus on sustainable and eco-friendly building design. Skilled in Revit and green building principles.' },
    { id: 'cand-42', name: 'Gayatri Devi', profile: 'A classical dancer and instructor with over 15 years of experience in Bharatanatyam. Runs her own dance academy.' },
    { id: 'cand-43', name: 'Hitesh Kumar', profile: 'A supply chain manager with expertise in logistics, inventory management, and vendor negotiations. Improved supply chain efficiency by 20% in the previous role.' },
    { id: 'cand-44', name: 'Indrani Mukherjee', profile: 'A research scientist with a Ph.D. in Biotechnology. Published several papers on genetic engineering and its applications.' },
    { id: 'cand-45', name: 'Jatin Mehta', profile: 'A hardware engineer with experience in PCB design and embedded systems programming using C and C++.' },
    { id: 'cand-46', name: 'Kavita Singh', profile: 'A social media manager who excels at creating viral content and building online communities. Grew an Instagram account from 0 to 100k followers in one year.' },
    { id: 'cand-47', name: 'Lalit Pandit', profile: 'A music composer and producer with a home studio setup. Skilled in Ableton Live and has composed music for short films and advertisements.' },
    { id: 'cand-48', name: 'Madhuri Dixit', profile: 'Not the actress. A clinical psychologist providing counseling and therapy services for adults and adolescents.' },
    { id: 'cand-49', name: 'Naveen Jindal', profile: 'An iOS developer proficient in Swift and SwiftUI. Has multiple apps published on the App Store with high ratings.' },
    { id: 'cand-50', name: 'Ojas Rawal', profile: 'A stand-up comedian and actor known for his observational humor. Also a skilled corporate trainer for public speaking workshops.' },
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<{ id: string, name: string }[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

      const storedHistory = localStorage.getItem(APPLICATION_HISTORY_KEY);
      if (storedHistory) setApplicationHistory(JSON.parse(storedHistory));
       
      const storedBlocked = localStorage.getItem(BLOCKED_USERS_KEY);
      if (storedBlocked) setBlockedUsers(JSON.parse(storedBlocked));

      if(user) {
        const storedConversations = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
        if (storedConversations) {
            setConversations(JSON.parse(storedConversations));
        } else {
            setConversations(getMockConversations(user.role));
        }
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
            setJobs(jobsData.length > 0 ? jobsData : MOCK_JOBS);
        });

        const unsubscribeCandidates = onSnapshot(collection(db, "candidates"), (querySnapshot) => {
            const candidatesData: Candidate[] = [];
            querySnapshot.forEach((doc) => {
                candidatesData.push({ id: doc.id, ...doc.data() } as Candidate);
            });
            setCandidates(candidatesData.length > 0 ? candidatesData : MOCK_CANDIDATES);
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
    if(user) { // Only save conversations if a user is logged in
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations, user]);

  useEffect(() => {
    localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
  }, [blockedUsers]);


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

  const unblockUser = (userId: string) => {
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
  }


  useEffect(() => {
    if (!user) return;
     const mockConvos = getMockConversations(user?.role || 'user');
     const storedConversationsStr = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
     let storedConversations: Conversation[];
     
     try {
       storedConversations = storedConversationsStr ? JSON.parse(storedConversationsStr) : mockConvos;
     } catch (e) {
       storedConversations = mockConvos;
     }
     
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
        // Only use the recruiter mock data if showing recruiter conversations
        if(storedConversations === mockConvos) {
            setConversations(getMockConversations('recruiter'));
        } else {
            setConversations(uniqueConvos);
        }
    } else if (user?.role === 'user') {
        // For users, if there's nothing in storage, use their specific mock data.
       if (storedConversations === mockConvos) {
         setConversations(getMockConversations('user'));
       } else {
         setConversations(storedConversations);
       }
    }
  }, [notifications, user]);


  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, toggleMute, initiateConversation, applicationHistory, updateApplicationStatus, conversations, setConversations, jobs, addJob, deleteJob, candidates, updateCandidateProfile, blockedUsers, unblockUser }}>
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
