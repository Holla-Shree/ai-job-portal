

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export type UserRole = 'user' | 'recruiter' | 'admin';

export interface User {
  id: string; 
  name: string;
  role: UserRole;
  avatar?: string;
  email?: string; 
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (role: UserRole, id: string, email: string, name: string, avatar?: string) => void;
  logout: () => void;
  updateUserAvatar: (newUrl: string) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = () => {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser: User = JSON.parse(storedUser);
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

  const login = (role: UserRole, id: string, email: string, name: string, avatar?: string) => {
    setLoading(true);
    const avatarText = name ? name.charAt(0).toUpperCase() : 'U';
    
    const newUser: User = { 
      role, 
      id, 
      email, 
      name,
      avatar: avatar || `https://placehold.co/40x40.png?text=${avatarText}`, 
    };
    
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    window.location.href = '/';
  };
  
  const updateUserAvatar = async (newUrl: string) => {
    if (!user) throw new Error("User not authenticated");

    let collectionName = 'candidates';
    if (user.role === 'recruiter') {
        collectionName = 'recruiters';
    } else if (user.role === 'admin') {
        collectionName = 'admins';
    }
    
    const userDocRef = doc(db, collectionName, user.id);
    
    try {
        await setDoc(userDocRef, { avatar: newUrl }, { merge: true });
        
        const updatedUser = { ...user, avatar: newUrl };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch(error) {
        console.error("Failed to update user avatar in Firestore:", error);
        throw error;
    }
  }

  const value = { user, loading, login, logout, updateUserAvatar, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
