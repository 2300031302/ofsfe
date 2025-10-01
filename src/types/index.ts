export interface User {
  id: string;
  username: string;
  email: string;
}


// types/FileMeta.ts
export interface FileMeta {
  id: number;
  fileName: string;
  fileType: string;
  date: string;
  data: string; // Base64 encoded string
  public: boolean;
  allowedEmails?: string[];
}

// Define the complete type for a FileItem
export interface FileItem {
  id: string;
  name: string;
  privacy: 'public' | 'private';
  shareLink: string;
  size: number;
  type: string;
  uploadDate: string;
  allowedEmails?: string[];
  allowedUsers?: string[];
  fileName?: string;
  fileType?: string;
  date?: string;
  data?: string;
  public?: boolean;
}


// export interface FileItem {
//   id: string;
//   name: string;
//   size: number;
//   type: string;
//   uploadDate: Date;
//   shareLink: string;
//   privacy: 'public' | 'private';
//   allowedEmails?: string[];
// }

export interface ContactForm {
  id: number;
  username: string;
  name: string;
  contact: string;
  message: string;
  viewed: boolean;
}

export interface ValidationErrors {
  contact?: string;
  password?: string;
  username?: string;
  name?: string;
  message?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin';
  createdAt: Date;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalFiles: number;
  totalStorage: number;
  publicFiles: number;
  privateFiles: number;
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  fileTypes: { [key: string]: number };
  uploadsThisMonth: number;
  averageFileSize: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin';
  createdAt: Date;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalFiles: number;
  totalStorage: number;
  publicFiles: number;
  privateFiles: number;
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  fileTypes: { [key: string]: number };
  uploadsThisMonth: number;
  averageFileSize: number;
}

export interface AdminMessage {
  id: string;
  userId: string;
  username: string;
  email: string;
  subject: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}