import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This function will fetch all file data concurrently
    const fetchUserFiles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Step 1: Fetch the list of file IDs for the user
        const fileIdsResponse = await fetch(`http://localhost:2518/users/1/files`);
        if (!fileIdsResponse.ok) {
          throw new Error('Failed to fetch file IDs.');
        }
        const fileIds = await fileIdsResponse.json();

        if (fileIds.length === 0) {
          setFiles([]);
          setIsLoading(false);
          return;
        }

        // Step 2: Fetch the metadata for each file concurrently
        // Create an array of promises for each file fetch
        const filePromises = fileIds.map((id: string) =>
          fetch(`http://localhost:2518/files/${id}/meta`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`Failed to fetch metadata for file ID: ${id}`);
              }
              return res.json();
            })
        );

        // Wait for all promises to resolve
        const fetchedFiles = await Promise.all(filePromises);

        // Update the state with the fetched data
        setFiles(fetchedFiles);

      } catch (e) {
        setError(e.message);
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserFiles();
  }, []);

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