import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { AuthService } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { type User as AppUser } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userData: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateIncome: (income: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Загружаем дополнительные данные пользователя
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setUserData(userDoc.data() as AppUser);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await AuthService.login(email, password);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      await AuthService.register(data);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
    } finally {
      setLoading(false);
    }
  };

  const updateIncome = async (income: number) => {
    if (!currentUser) return;
    
    try {
      await AuthService.updateUserIncome(currentUser.uid, income);
      setUserData(prev => prev ? { ...prev, monthlyIncome: income } : null);
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    register,
    logout,
    updateIncome,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};