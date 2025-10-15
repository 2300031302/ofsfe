import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, File, X, Check, Cloud, Zap, Lock, Globe, Plus, Trash2 as TrashIcon } from 'lucide-react';
import { useFiles } from '../context/FileContext';
import { FileItem } from '../types';
import UploadModal from '../components/UploadModal';
import { validateEmail } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

const API_URL = "https://ofsbe-production.up.railway.app/files";


const Upload: React.FC = () => {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentShareLink, setCurrentShareLink] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [currentFile, setCurrentFile] = useState<FileItem | undefined>(undefined);
  
  const { addFile, generateShareLink } = useFiles();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const simulateUpload = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          clearInterval(interval);
          resolve();
        } else {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        }
      }, 150);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    // Validate private file settings
    if (privacy === 'private' && allowedEmails.length === 0) {
      alert('Please add at least one email address for private files.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    for (const file of selectedFiles) {
      await simulateUpload(file);
      
      const shareLink = generateShareLink(file.name);
      const fileItem: FileItem = {
        id: Date.now().toString() + Math.random().toString(36),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date(),
        shareLink,
        privacy,
        allowedEmails: privacy === 'private' ? [...allowedEmails] : undefined
      };
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isPublic", privacy === 'public' ? "true" : "false");
      if (privacy === 'private') {
        if (user?.email && !allowedEmails.includes(user.email)) {
          allowedEmails.push(user.email);
        }
        console.log(user?.email);
        formData.append("allowedUsers", allowedEmails.join(","));
        // backend will split by comma
      }
      console.log("Uploading file:", privacy.toString());
      console.log("updated mails", allowedEmails);
      try {
        const response = await fetch("https://ofsbe-production.up.railway.app/files/upload", {
        method: "POST",
        body: formData,
        });
        const responseText = await response.text(); // backend message like "File uploaded successfully"
        console.log("reponse:", responseText);
        console.log("user id:", user?.id);
        const response1 = await fetch(`https://ofsbe-production.up.railway.app/users/${user?.id}/add-file/${responseText}`, {
          method: "POST"
        });
        console.log("Response from file upload:", response1.body);
        return response1.body;
      } catch (error: any) {
        console.error("Upload failed:", error.response?.data || error.message);
        throw error;
      }
      addFile(fileItem);
      
      if (selectedFiles.length === 1) {
        setCurrentShareLink(shareLink);
        setCurrentFile(fileItem);
        setShowModal(true);
      }
    }

    setIsUploading(false);
    if (selectedFiles.length > 1) {
      setSelectedFiles([]);
      setUploadProgress({});
      setPrivacy('public');
      setAllowedEmails([]);
    }
  };

  const addEmail = () => {
    const emailValidation = validateEmail(newEmail);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    
    if (allowedEmails.includes(newEmail)) {
      setEmailError('Email already added');
      return;
    }
    
    setAllowedEmails(prev => [...prev, newEmail]);
    setNewEmail('');
    setEmailError('');
  };

  const removeEmail = (email: string) => {
    setAllowedEmails(prev => prev.filter(e => e !== email));
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFiles([]);
    setUploadProgress({});
    setPrivacy('public');
    setAllowedEmails([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pt-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Upload Your Files</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Drag and drop your files or click to browse. We support all file types up to 100MB each.
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 ${
              dragActive
                ? 'border-blue-500 bg-blue-50 scale-105'
                : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
            } shadow-lg hover:shadow-xl`}
          >
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            
            <div className="space-y-6">
              <motion.div 
                className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                  dragActive ? 'bg-blue-100' : 'bg-gray-100'
                }`}
                animate={{ scale: dragActive ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {dragActive ? (
                  <Cloud className="h-10 w-10 text-blue-600" />
                ) : (
                  <UploadIcon className="h-10 w-10 text-gray-600" />
                )}
              </motion.div>
              
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  {dragActive ? 'Drop your files here' : 'Choose files or drag and drop'}
                </h3>
                <p className="text-gray-600 mb-4">
                  Support for all file types • Maximum 100MB per file
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4" />
                    <span>Fast Upload</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Check className="h-4 w-4" />
                    <span>Secure</span>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                disabled={isUploading}
              >
                Browse Files
              </button>
            </div>
          </div>
        </motion.div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Selected Files ({selectedFiles.length})
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <File className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {isUploading && uploadProgress[file.name] !== undefined ? (
                      <div className="flex items-center space-x-3">
                        {uploadProgress[file.name] === 100 ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <Check className="h-5 w-5" />
                            <span className="text-sm font-medium">Complete</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[file.name] || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-medium min-w-[3rem]">
                              {Math.round(uploadProgress[file.name] || 0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                        disabled={isUploading}
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {!isUploading && (
              <button
                onClick={handleUpload}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
              </button>
            )}
          </motion.div>
        )}
        
        {/* Privacy Settings */}
        {selectedFiles.length > 0 && !isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
            
            {/* Privacy Options */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={privacy === 'public'}
                    onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Public</span>
                  </div>
                </label>
                <p className="text-sm text-gray-600">Anyone with the link can access</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={privacy === 'private'}
                    onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-gray-900">Private</span>
                  </div>
                </label>
                <p className="text-sm text-gray-600">Only specific people can access</p>
              </div>
            </div>
            
            {/* Email Access Control for Private Files */}
            {privacy === 'private' && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Allowed Email Addresses</h4>
                
                {/* Add Email Input */}
                <div className="flex space-x-2 mb-4">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      onKeyPress={handleEmailKeyPress}
                      placeholder="Enter email address"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        emailError ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {emailError && (
                      <p className="text-red-600 text-sm mt-1">{emailError}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addEmail}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </div>
                
                {/* Email List */}
                {allowedEmails.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Allowed users:</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {allowedEmails.map((email, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                          <span className="text-sm text-gray-700">{email}</span>
                          <button
                            onClick={() => removeEmail(email)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            title="Remove email"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {allowedEmails.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg">
                    Add email addresses to grant access to your private files
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Upload Modal */}
        <UploadModal
          isOpen={showModal}
          onClose={closeModal}
          shareLink={currentShareLink}
          file={currentFile}
        />
      </div>
    </div>
  );
};

export default Upload;
