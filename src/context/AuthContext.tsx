import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';
import { User } from '../types';

const API_BASE = "http://localhost:2518/users"; // your backend URL

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const savedAdmin = localStorage.getItem('isAdmin');
    return savedAdmin === 'true';
  });

  const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_BASE}/login`, { email, password });

    const user = response.data;
    setUser(user);
    console.log(user);
    localStorage.setItem("user", JSON.stringify(user));
    return true;
  } catch (error) {
    console.error("Login failed:", error);
    return false;
  }
};

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check admin credentials (admin@fileshare.com / admin123)
    if (email === 'admin@fileshare.com' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@fileshare.com'
      };
      
      setUser(adminUser);
      setIsAdmin(true);
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('isAdmin', 'true');
      return true;
    }
    
    return false;
  };

  const signup = async (username: string, email: string, password: string): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_BASE}/create`, {
      username,
      email,
      password,
    });

    const user = response.data;
    setUser(user);
    console.log(user);
    localStorage.setItem("user", JSON.stringify(user));
    return true;
  } catch (error) {
    console.error("Signup failed:", error);
    return false;
  }
};

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
  };

  const value = {
    user,
    isAdmin,
    login,
    adminLogin,
    signup,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};