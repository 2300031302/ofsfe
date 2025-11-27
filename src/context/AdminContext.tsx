import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, FileItem, UserStats, FileStats, AdminMessage, FileMeta, ContactForm } from '../types';
import axios from 'axios';

const API_BASE = "http://locahost:2518";

interface AdminContextType {
  users: User[];
  allFiles: FileMeta[];
  messages: ContactForm[];
  setMessages: React.Dispatch<React.SetStateAction<ContactForm[]>>;
  userStats: UserStats;
  fileStats: FileStats;
  deleteUser: (userId: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  getUserFiles: (userId: string, username?: string, mail?: string) => Promise<FileMeta[]>;
  addMessage: (messageData: Omit<ContactForm, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  refreshStats: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [allFiles, setAllFiles] = useState<FileMeta[]>([]);
  const [messages, setMessages] = useState<ContactForm[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalFiles: 0,
    totalStorage: 0,
    publicFiles: 0,
    privateFiles: 0,
  });
  const [fileStats, setFileStats] = useState<FileStats>({
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {},
    uploadsThisMonth: 0,
    averageFileSize: 0,
  });

  // ✅ Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, filesRes, messagesRes] = await Promise.all([
          axios.get<User[]>(`${API_BASE}/users`),
          axios.get<FileMeta[]>(`${API_BASE}/files`),
          axios.get<ContactForm[]>(`${API_BASE}/messages`),
        ]);

        setUsers(usersRes.data);
        setAllFiles(filesRes.data);
        setMessages(messagesRes.data);
        console.log("messagesres:", messagesRes.data);
        console.log("mes:", messages);
        refreshStats(usersRes.data, filesRes.data);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };

    fetchData();
  }, []);

  function getFileSizeFromBase64(base64: string): number {
    const padding = (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    return Math.floor(base64.length * 3 / 4) - padding; // in bytes
  }

  // ✅ Helpers to calculate stats
  const calculateUserStats = (usersData: User[], filesData: FileMeta[]): UserStats => {
    const totalStorage = filesData.reduce((acc, file) => acc + getFileSizeFromBase64(file.data), 0);
    const publicFiles = filesData.filter(f => f.public === true ).length;
    const privateFiles = filesData.filter(f => f.public === false).length;

    return {
      totalUsers: usersData.length,
      activeUsers: usersData.length, // for now assume all active
      newUsersThisMonth: usersData.length, // mock
      totalFiles: filesData.length,
      totalStorage,
      publicFiles,
      privateFiles,
    };
  };

  const calculateFileStats = (filesData: FileMeta[]): FileStats => {
    const totalSize = filesData.reduce((acc, file) => acc + getFileSizeFromBase64(file.data), 0);
    const fileTypes: { [key: string]: number } = {};
    filesData.forEach(file => {
      const type = file.fileType?.split('/')[0] || 'other';
      fileTypes[type] = (fileTypes[type] || 0) + 1;
    });

    return {
      totalFiles: filesData.length,
      totalSize,
      fileTypes,
      uploadsThisMonth: filesData.length,
      averageFileSize: filesData.length > 0 ? totalSize / filesData.length : 0,
    };
  };

  const refreshStats = (usersData = users, filesData = allFiles) => {
    setUserStats(calculateUserStats(usersData, filesData));
    setFileStats(calculateFileStats(filesData));
  };

  // ✅ CRUD Functions (backend integrated)
  const deleteUser = async (userId: string) => {
    try {
      await axios.delete(`${API_BASE}/users/${userId}`);
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      refreshStats(updatedUsers, allFiles);
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await axios.delete(`${API_BASE}/users/deletefile/${fileId}`);
      await axios.delete(`${API_BASE}/files/${fileId}?email=admin@gmail.com`);
      const updatedFiles = allFiles.filter(f => f.id !== new Number(fileId));
      setAllFiles(updatedFiles);
      refreshStats(users, updatedFiles);
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const getUserFiles = async (userId: string, username?: string, mail?: string): Promise<FileMeta[]> => {
    try {
      if (username && mail) {
        const res = await axios.get<FileMeta[]>(`${API_BASE}/files/username/${username}/files`, {
          params: { mail }
        });
        return res.data;
      } else {
        const res = await axios.get<FileMeta[]>(`${API_BASE}/files/user/${userId}/files`);
        return res.data;
      }
    } catch (err) {
      console.error("Error fetching user files:", err);
      return [];
    }
  };

  const addMessage = async (messageData: Omit<ContactForm, 'id' | 'timestamp' | 'isRead'>) => {
    try {
      const res = await axios.post<ContactForm>(`${API_BASE}/messages/send`, messageData);
      setMessages(prev => [res.data, ...prev]);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await axios.put(`${API_BASE}/messages/${messageId}/view`);
      setMessages(prev => prev.map(m => m.id === Number(messageId) ? { ...m, isRead: true } : m));
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await axios.delete(`${API_BASE}/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m.id !== Number(messageId)));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const value = {
    users,
    allFiles,
    messages,
    setMessages,
    userStats,
    fileStats,
    deleteUser,
    deleteFile,
    getUserFiles,
    addMessage,
    markMessageAsRead,
    deleteMessage,
    refreshStats,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
