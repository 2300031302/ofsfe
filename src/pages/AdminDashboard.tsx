import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { Users, Files, BarChart3, Settings, Trash2, Eye, Download, Lock, Globe, Search, Filter, Mail, Clock, CheckCircle, EyeOff, User as UserIcon } from 'lucide-react';
import { User as UserType, FileItem, FileMeta,  ContactForm } from '../types';

interface Message { // This interface is for the mock messages, not the UserType from types.ts
  id: number;
  username: string;
  name: string;
  contact: string;
  message: string;
  viewed: boolean;
}


const AdminDashboard: React.FC = () => {
  const { users, messages,setMessages, allFiles, userStats,  fileStats, deleteUser, deleteFile, getUserFiles,markMessageAsRead } = useAdmin();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'files' | 'messages'>('overview');
  const [searchTerm, setSearchTerm] = useState(''); // This searchTerm is for the current tab's search
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactForm | null>(null);
  // const [umessages, setMessages] = useState(messages);
  const [userFilesCountMap, setUserFilesCountMap] = React.useState<Record<number, number | null>>({});
  console.log("messages in admin dashboard:", messages);
  // console.log("umessages in admin dashboard:", umessages);
  // setMessages(messages);


  React.useEffect(() => {
    let mounted = true;
    async function fetchCounts() {
      try {
        // use users or filteredUsers depending on whether counts should be for all users or only filtered set
        const targetUsers = users; // or filteredUsers
        const results = await Promise.all(
          targetUsers.map(u =>
            getUserFiles(u.id)
              .then(files => files.length)
              .catch(() => null)
          )
        );

        if (!mounted) return;
        const map: Record<number, number | null> = {};
        targetUsers.forEach((u, i) => {
          map[Number(u.id)] = results[i];
        });
        setUserFilesCountMap(map);
      } catch (err) {
        if (mounted) {
          // handle error globally if required
        }
      }
    }
    fetchCounts();
    return () => { mounted = false; };
  }, [users /* or filteredUsers if you want refresh on filter change */]);

  function getFileSizeFromBase64(base64: string): number {
    const padding = (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    return Math.floor(base64.length * 3 / 4) - padding; // in bytes
  }

  const filteredMessages: ContactForm[] = messages.filter((msg) =>
    msg.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔹 Mark as viewed
  const handleViewMessage = (id: number): void => {
    markMessageAsRead(id.toString());
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, viewed: true } : msg
      )
    );
  };

  // 🔹 Delete message
  const handleDeleteMessage = (id: number): void => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
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
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"? This will also delete all their files.`)) {
      deleteUser(userId);
    }
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {

    if (confirm(`Are you sure you want to delete file "${fileName}"?`)) {
      deleteFile(fileId);
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFiles = allFiles.filter(file =>
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'files', label: 'Files', icon: Files },
    { id: 'messages', label: 'Messages', icon: Mail },
  ];

  function handleMarkAsRead(id: any) {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">Manage users, files, and monitor platform activity</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm p-2 mb-8 border border-gray-100"
        >
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Total Users</h3>
                <p className="text-sm text-gray-600">{userStats.newUsersThisMonth} new this month</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Files className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{userStats.totalFiles}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Total Files</h3>
                <p className="text-sm text-gray-600">{fileStats.uploadsThisMonth} uploaded this month</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Globe className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{userStats.publicFiles}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Public Files</h3>
                <p className="text-sm text-gray-600">{userStats.privateFiles} private files</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{formatFileSize(userStats.totalStorage)}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Total Storage</h3>
                <p className="text-sm text-gray-600">Avg: {formatFileSize(fileStats.averageFileSize)}</p>
              </div>
            </div>

            {/* File Types Chart */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">File Types Distribution</h3>
              <div className="space-y-3">
                {Object.entries(fileStats.fileTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / fileStats.totalFiles) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 min-w-[2rem]">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Users ({filteredUsers.length})</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const userFilesCount = userFilesCountMap[Number(user.id)] ?? null;
                  console.log("user id:", user.id);

                  

                  return (
                    <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-3 rounded-full">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{user.username}</h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500">
                              {userFilesCount !== null ? `${userFilesCount} files uploaded` : 'Loading...'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Files</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Files List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Files ({filteredFiles.length})</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <Files className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 truncate">{file.fileName}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{formatFileSize(getFileSizeFromBase64(file.data))}</span>
                            <span>•</span>
                            <span>{formatDate(new Date(file.date))}</span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              {file.public === false ? (
                                <>
                                  <Lock className="h-3 w-3 text-red-600" />
                                  <span className="text-red-600">Private</span>
                                </>
                              ) : (
                                <>
                                  <Globe className="h-3 w-3 text-green-600" />
                                  <span className="text-green-600">Public</span>
                                </>
                              )}
                            </div>
                          </div>
                          {file.public === false && file.allowedEmails && (
                            <p className="text-xs text-gray-500 mt-1">
                              Allowed: {file.allowedEmails.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(`https://ofsbe-production.up.railway.app/files/${file.id}?mail=admin@gmail.com"`, '_blank')}
                          className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id.toString(), file.fileName)}
                          className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center space-x-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Messages List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  All Messages ({filteredMessages.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredMessages.map((msg) => (
                  <div key={msg.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      {/* User Info + Message */}
                      <div className="flex items-start space-x-4 min-w-0 flex-1">
                        <div className="bg-gray-100 p-3 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {msg.message}{" "}

                            </h4>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{msg.name} <span className="text-sm text-gray-500">
                            (@{msg.username})
                          </span></p>
                          <p className="text-xs text-gray-500 mt-1">
                            <a
                              href={`mailto:${msg.contact}?subject=${encodeURIComponent(
                                `solution from fs - ${msg.message}`
                              )}`}
                              className="text-blue-600 hover:underline"
                            >
                              Contact: {msg.contact}
                            </a>

                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewMessage(msg.id)}
                          disabled={msg.viewed}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${msg.viewed
                            ? "bg-green-100 text-green-700 cursor-default"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            }`}
                        >
                          {msg.viewed ? (
                            <>
                              <Eye className="h-4 w-4" />
                              <span>Viewed</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4" />
                              <span>View</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center space-x-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredMessages.length === 0 && (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No messages found.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* User Files Modal */}
        {selectedUser && (
          <UserFilesModal
            selectedUser={selectedUser}
            onClose={() => setSelectedUser(null)}
            getUserFiles={getUserFiles}
            formatFileSize={formatFileSize}
            formatDate={formatDate}
            handleDeleteFile={handleDeleteFile}
          />
        )}

        {/* Message Details Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedMessage.message}</h3>
                    <p className="text-sm text-gray-600">From: {selectedMessage.username} ({selectedMessage.contact})</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    {!selectedMessage.viewed && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        UNREAD
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-3">Message:</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="flex space-x-3">
                  {!selectedMessage.viewed && (
                    <button
                      onClick={() => {
                        handleMarkAsRead(selectedMessage.id);
                        setSelectedMessage({ ...selectedMessage, viewed: true });
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Mark as Read</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleDeleteMessage(selectedMessage.id);
                      setSelectedMessage(null);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Message</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
interface UserFilesModalProps {
  selectedUser: UserType;
  onClose: () => void;
  getUserFiles: (userId: string) => Promise<FileMeta[]>;
  formatFileSize: (bytes: number) => string;
  formatDate: (date: Date) => string;
  handleDeleteFile: (fileId: string, fileName: string) => void;
}

const UserFilesModal: React.FC<UserFilesModalProps> = ({
  selectedUser,
  onClose,
  getUserFiles,
  formatFileSize,
  formatDate,
  handleDeleteFile,
}) => {
  const [files, setFiles] = React.useState<FileMeta[] | null>(null);

  function getFileSizeFromBase64(base64: string): number {
    const padding = (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    return Math.floor(base64.length * 3 / 4) - padding; // in bytes
  }

  React.useEffect(() => {
    let isMounted = true;
    setFiles(null); // reset while loading
    getUserFiles(selectedUser.id).then((f) => {
      if (isMounted) setFiles(f);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedUser.id, getUserFiles]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedUser.username}'s Files
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {files === null ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : files.length === 0 ? (
            <div className="text-center text-gray-500">No files found.</div>
          ) : (
            files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{file.fileName}</h4>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(getFileSizeFromBase64(file.data))} • {formatDate(new Date(file.date))}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {file.public !== true ? (
                    <Lock className="h-4 w-4 text-red-600" />
                  ) : (
                    <Globe className="h-4 w-4 text-green-600" />
                  )}
                  <button
                    onClick={() => handleDeleteFile(file.id.toString(), file.fileName)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

// export default AdminDashboard;
