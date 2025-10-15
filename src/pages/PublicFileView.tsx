import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { File, FileText, Image, Video, Music, Archive, Download, ArrowLeft, User, Lock, Globe, AlertCircle, Mail } from 'lucide-react';
import { FileItem, FileMeta } from '../types';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const PublicFileView: React.FC = () => {
  const { user } = useAuth();
  const { username, fileId } = useParams<{ username: string; fileId: string }>();
  const [file, setFile] = useState<FileMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const loadFile = async () => {
      setLoading(true);
      
      // Check if this is the current user's files
      const savedUser = localStorage.getItem('user');
      const currentUser = savedUser ? JSON.parse(savedUser) : null;

      console.log("file id:",fileId);
      console.log("user email:",user?.email);
      

      const access=await axios.get<boolean>(`https://ofsbe-production.up.railway.app/files/access/${fileId}`,{ params: { mail: user?.email } });
      if(access.data){
        setAccessDenied(false);
        console.log("Access granted", access);

      }else{
        setAccessDenied(true);
      }

      axios.get<FileMeta>(`https://ofsbe-production.up.railway.app/files/${fileId}/meta`)
        .then(response => {
          setFile(response.data);
          // If file is private and user is not the owner, require email
          if (!response.data.public && (!currentUser || currentUser.username !== username)) {
            setAccessDenied(true);
          } else {
            setAccessDenied(false);
          }
        })
        .catch(error => {
          console.error(error);
          setFile(null);
        });
        console.log(file);

      setTimeout(() => setLoading(false), 800);
    };

    loadFile();
  }, [username, fileId]);

  function getFileSizeFromBase64(base64: string): number {
    const padding = (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    return Math.floor(base64.length * 3 / 4) - padding; // in bytes
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-16 w-16 text-blue-600" />;
    if (type.startsWith('video/')) return <Video className="h-16 w-16 text-purple-600" />;
    if (type.startsWith('audio/')) return <Music className="h-16 w-16 text-green-600" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-16 w-16 text-red-600" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-16 w-16 text-orange-600" />;
    return <File className="h-16 w-16 text-gray-600" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = () => {
    // Mock download functionality
    const link = document.createElement('a');
    link.href = '#';
    link.download = file?.fileName || 'file';
    link.click();
    
    // Show download notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = `Downloading ${file?.fileName}...`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail) {
      setEmailError('Email is required');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Check if email is in allowed list
    if (file?.allowedEmails && file.allowedEmails.includes(userEmail)) {
      setAccessDenied(false);
      setEmailSubmitted(true);
      setEmailError('');
    } else {
      setEmailError('Your email is not authorized to access this file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading file...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="bg-red-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <File className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">File Not Found</h1>
          <p className="text-gray-600 mb-6">
            The file "{fileId}" doesn't exist or is no longer available.
          </p>
          <Link
            to={`/${username}/files`}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Search</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Show access denied for private files
  if (accessDenied && file.public && !emailSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Private File</h1>
              <p className="text-gray-600">
                This file is private and requires authorization to access.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      emailError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your.email@example.com"
                  />
                </div>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-red-600 text-sm mt-1 flex items-center space-x-1"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>{emailError}</span>
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Request Access
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to={`/${username}/files`}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors inline-flex items-center space-x-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Files</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {username}'s File
            </h1>
          </div>
        </motion.div>

        {/* File Details Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 mb-8"
        >
          <div className="text-center mb-8">
            {getFileIcon(file.fileType)}
            <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">{file.fileName}</h2>
            <div className="flex items-center justify-center space-x-4 text-gray-600">
              <span>{formatFileSize(getFileSizeFromBase64(file.data))}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                {file.public === false ? (
                  <>
                    <Lock className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">Private</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Public</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">File Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{file.fileType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="font-medium">{formatFileSize(getFileSizeFromBase64(file.data))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uploaded:</span>
                  <span className="font-medium">{formatDate(new Date(file.date))}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Access Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  {file.public === false ? (
                    <>
                      <Lock className="h-4 w-4 text-red-600" />
                      <span>Private file</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 text-green-600" />
                      <span>Public file</span>
                    </>
                  )}
                </div>
                {file.public === false && file.allowedEmails && (
                  <div className="text-xs">
                    <span>Authorized users: {file.allowedEmails.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {emailSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center space-x-2 text-green-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Access Granted!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your email has been verified. You can now download this file.
              </p>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Download File</span>
            </button>
            <Link
              to={`/${username}/files`}
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Files</span>
            </Link>
          </div>
        </motion.div>

        {/* URL Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center"
        >
          <h3 className="font-semibold text-blue-900 mb-2">File URL</h3>
          <code className="bg-white px-4 py-2 rounded border text-sm text-blue-800 break-all">
            {window.location.href}
          </code>
          <p className="text-xs text-blue-600 mt-2">
            {file.public === false
              ? 'This URL is only accessible to authorized users'
              : 'This URL can be shared with anyone'
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicFileView;
