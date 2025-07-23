
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotifications } from './NotificationContext'; // Corrected import

export type UserRole = 'user' | 'recruiter' | 'admin';

interface User {
  id?: string; // Add ID for linking to profiles
  role: UserRole;
  avatar?: string;
  email?: string; // Add email for display
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (role: UserRole, id?: string, email?: string) => void;
  logout: () => void;
  updateAvatar: (avatar: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for a logged-in user (e.g., from localStorage)
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (role: UserRole, id?: string, email?: string) => {
    const newUser: User = { role, id, email, avatar: `https://placehold.co/40x40.png?text=${(email || 'U').charAt(0).toUpperCase()}` };
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

  const value = { user, loading, login, logout, updateAvatar };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
