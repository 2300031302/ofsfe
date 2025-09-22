import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, FileItem, UserStats, FileStats, AdminMessage } from '../types';
import axios from 'axios';

interface AdminContextType {
  users: User[];
  allFiles: FileItem[];
  userStats: UserStats;
  fileStats: FileStats;
  deleteUser: (userId: string) => void;
  deleteFile: (fileId: string) => void;
  getUserFiles: (userId: string) => FileItem[];
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
  // Mock users data
  const [users, setUsers] = useState<User[]>([]);

  // Mock messages data
  const [messages, setMessages] = useState<AdminMessage[]>([
    {
      id: 'msg1',
      userId: '1',
      username: 'john_doe',
      email: 'john@example.com',
      subject: 'File Upload Issue',
      message: 'I am having trouble uploading large files. The upload seems to fail after 50% completion. Can you please help?',
      timestamp: new Date('2024-01-15T10:30:00'),
      isRead: false,
      priority: 'high'
    },
    {
      id: 'msg2',
      userId: '2',
      username: 'jane_smith',
      email: 'jane@example.com',
      subject: 'Feature Request',
      message: 'It would be great if we could have bulk file operations like selecting multiple files and deleting them at once.',
      timestamp: new Date('2024-01-14T14:20:00'),
      isRead: true,
      priority: 'medium'
    },
    {
      id: 'msg3',
      userId: '3',
      username: 'mike_wilson',
      email: 'mike@example.com',
      subject: 'Account Access',
      message: 'I forgot my password and the reset email is not arriving. Please help me regain access to my account.',
      timestamp: new Date('2024-01-13T09:15:00'),
      isRead: false,
      priority: 'high'
    }
  ]);

  // Mock files data
  const [allFiles, setAllFiles] = useState<FileItem[]>([
    {
      id: 'file1',
      name: 'presentation.pdf',
      size: 2048000,
      type: 'application/pdf',
      uploadDate: new Date('2024-01-15'),
      shareLink: 'http://localhost:3000/john_doe/files/presentation.pdf',
      privacy: 'public'
    },
    {
      id: 'file2',
      name: 'vacation-photos.zip',
      size: 15728640,
      type: 'application/zip',
      uploadDate: new Date('2024-01-10'),
      shareLink: 'http://localhost:3000/jane_smith/files/vacation-photos.zip',
      privacy: 'private',
      allowedEmails: ['friend@example.com']
    },
    {
      id: 'file3',
      name: 'project-demo.mp4',
      size: 52428800,
      type: 'video/mp4',
      uploadDate: new Date('2024-01-12'),
      shareLink: 'http://localhost:3000/mike_wilson/files/project-demo.mp4',
      privacy: 'public'
    },
    {
      id: 'file4',
      name: 'resume.pdf',
      size: 1024000,
      type: 'application/pdf',
      uploadDate: new Date('2024-01-08'),
      shareLink: 'http://localhost:3000/sarah_jones/files/resume.pdf',
      privacy: 'public'
    },
    {
      id: 'file5',
      name: 'confidential.docx',
      size: 512000,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadDate: new Date('2024-01-14'),
      shareLink: 'http://localhost:3000/john_doe/files/confidential.docx',
      privacy: 'private',
      allowedEmails: ['boss@company.com', 'hr@company.com']
    }
  ]);

  const calculateUserStats = (): UserStats => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const newUsersThisMonth = users.filter(user => {
      // Mock: assume all users are new this month for demo
      return true;
    }).length;

    const totalStorage = allFiles.reduce((acc, file) => acc + file.size, 0);
    const publicFiles = allFiles.filter(file => file.privacy === 'public').length;
    const privateFiles = allFiles.filter(file => file.privacy === 'private').length;

    return {
      totalUsers: users.length,
      activeUsers: users.length, // Mock: all users are active
      newUsersThisMonth,
      totalFiles: allFiles.length,
      totalStorage,
      publicFiles,
      privateFiles
    };
  };

  const calculateFileStats = (): FileStats => {
    const totalSize = allFiles.reduce((acc, file) => acc + file.size, 0);
    const fileTypes: { [key: string]: number } = {};
    
    allFiles.forEach(file => {
      const type = file.type.split('/')[0] || 'other';
      fileTypes[type] = (fileTypes[type] || 0) + 1;
    });

    return {
      totalFiles: allFiles.length,
      totalSize,
      fileTypes,
      uploadsThisMonth: allFiles.length, // Mock: all files uploaded this month
      averageFileSize: allFiles.length > 0 ? totalSize / allFiles.length : 0
    };
  };

  const [userStats, setUserStats] = useState<UserStats>(calculateUserStats());
  const [fileStats, setFileStats] = useState<FileStats>(calculateFileStats());

 useEffect(() => {
    axios
      .get<User[]>("http://localhost:2518/users") // ✅ Your backend endpoint
      .then((response) => {
        setUsers(response.data);
        
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      });
  }, []);

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    // Also remove files belonging to this user
    setAllFiles(prev => prev.filter(file => !file.shareLink.includes(users.find(u => u.id === userId)?.username || '')));
    refreshStats();
  };

  const deleteFile = (fileId: string) => {
    setAllFiles(prev => prev.filter(file => file.id !== fileId));
    refreshStats();
  };

  const getUserFiles = (userId: string): FileItem[] => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];
    return allFiles.filter(file => file.shareLink.includes(user.username));
  };

  const refreshStats = () => {
    setUserStats(calculateUserStats());
    setFileStats(calculateFileStats());
  };

  const addMessage = (messageData: Omit<AdminMessage, 'id' | 'timestamp' | 'isRead'>) => {
    const newMessage: AdminMessage = {
      ...messageData,
      id: Date.now().toString() + Math.random().toString(36),
      timestamp: new Date(),
      isRead: false
    };
    setMessages(prev => [newMessage, ...prev]);
  };

  const markMessageAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isRead: true } : msg
    ));
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const value = {
    users,
    allFiles,
    messages,
    userStats,
    fileStats,
    deleteUser,
    deleteFile,
    addMessage,
    markMessageAsRead,
    deleteMessage,
    getUserFiles,
    refreshStats
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};