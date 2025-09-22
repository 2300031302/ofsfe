import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FileItem } from '../types';

interface FileContextType {
  files: FileItem[];
  addFile: (file: FileItem) => void;
  deleteFile: (id: string) => void;
  generateShareLink: (fileName: string) => string;
  getUserFilesUrl: () => string;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>(() => {
    const savedFiles = localStorage.getItem('userFiles');
    return savedFiles ? JSON.parse(savedFiles) : [];
  });

  const addFile = (file: FileItem) => {
    const newFiles = [...files, file];
    setFiles(newFiles);
    localStorage.setItem('userFiles', JSON.stringify(newFiles));
  };

  const deleteFile = (id: string) => {
    const newFiles = files.filter(file => file.id !== id);
    setFiles(newFiles);
    localStorage.setItem('userFiles', JSON.stringify(newFiles));
  };

  const generateShareLink = (fileName: string): string => {
    // Get current user from localStorage
    const savedUser = localStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    const username = user?.username || 'anonymous';
    
    const baseUrl = window.location.origin;
    return `${baseUrl}/${username}/files/${encodeURIComponent(fileName)}`;
  };

  const getUserFilesUrl = (): string => {
    const savedUser = localStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    const username = user?.username || 'anonymous';
    
    const baseUrl = window.location.origin;
    return `${baseUrl}/${username}/files`;
  };

  const value = {
    files,
    addFile,
    deleteFile,
    generateShareLink,
    getUserFilesUrl
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};