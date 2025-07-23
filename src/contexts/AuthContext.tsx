
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotifications } from './NotificationContext'; // Corrected import
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type UserRole = 'user' | 'recruiter' | 'admin';

interface User {
  id: string; 
  role: UserRole;
  avatar?: string;
  email?: string; 
  savedJobs: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (role: UserRole, id: string, email?: string) => void;
  logout: () => void;
  updateAvatar: (avatar: string) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for a logged-in user (e.g., from localStorage)
    const initializeUser = async () => {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser: User = JSON.parse(storedUser);
            // Fetch the latest user data from Firestore to get saved jobs
            if (parsedUser.role === 'user' && parsedUser.id) {
                const userDocRef = doc(db, 'candidates', parsedUser.id);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const dbUser = userDocSnap.data();
                    parsedUser.savedJobs = dbUser.savedJobs || [];
                }
            }
            setUser(parsedUser);
          }
        } catch (error) {
          console.error("Failed to parse user from localStorage", error);
          localStorage.removeItem('user');
        } finally {
          setLoading(false);
        }
    }
    initializeUser();
  }, []);

  const login = async (role: UserRole, id: string, email?: string) => {
    setLoading(true);
    const avatarText = role === 'user' ? (email || 'J').charAt(0).toUpperCase() : (email || role).charAt(0).toUpperCase();
    let savedJobs: string[] = [];

    if (role === 'user' && id) {
        try {
            const userDocRef = doc(db, 'candidates', id);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                savedJobs = userDocSnap.data().savedJobs || [];
            }
        } catch (error) {
            console.error("Error fetching user data during login:", error);
        }
    }

    const newUser: User = { role, id, email, avatar: `https://placehold.co/40x40.png?text=${avatarText}`, savedJobs };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    window.location.href = '/';
  };
  
  const updateAvatar = (avatar: string) => {
    if (user) {
        const updatedUser = { ...user, avatar };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  const value = { user, loading, login, logout, updateAvatar, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
