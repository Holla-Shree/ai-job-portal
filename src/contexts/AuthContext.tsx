

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  login: (role: UserRole, id: string, email: string, name: string) => void;
  logout: () => void;
  updateAvatar: (file: File) => Promise<void>;
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

  const login = (role: UserRole, id: string, email: string, name: string) => {
    setLoading(true);
    const avatarText = name.charAt(0).toUpperCase();
    
    const newUser: User = { 
      role, 
      id, 
      email, 
      name,
      avatar: `https://placehold.co/40x40.png?text=${avatarText}`, 
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
  
  const updateAvatar = async (file: File) => {
    if (!user) throw new Error("User not authenticated");

    const storageRef = ref(storage, `profile-pictures/${user.id}/${file.name}`);
    
    // Upload the file
    await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Update user's avatar in Firestore
    // This assumes recruiters might have profiles elsewhere, so we check the role.
    const collectionName = user.role === 'user' ? 'candidates' : 'recruiters'; // Example, adjust if needed
    const userDocRef = doc(db, collectionName, user.id);
    await setDoc(userDocRef, { avatar: downloadURL }, { merge: true });

    // Update the local state and localStorage
    const updatedUser = { ...user, avatar: downloadURL };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
