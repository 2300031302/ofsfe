import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Copy, Check, Trash2, Upload, SortAsc, SortDesc, Lock, Globe } from 'lucide-react';
import { useFiles } from '../context/FileContext';
import { useNavigate } from 'react-router-dom';
import FileCard from '../components/FileCard';
import axios from 'axios';
import { FileItem, FileMeta } from '../types';
import { useAuth } from '../context/AuthContext';
import { title } from 'framer-motion/client';

const MyFiles: React.FC = () => {
  const { user } = useAuth();
  const { files, deleteFile, getUserFilesUrl } = useFiles();
  // const tile: FileMeta[] = [];
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'private'>('all');
  const [tile, setTile] = useState<FileMeta[]>([]);

  React.useEffect(() => {
    if (user?.id) {
      fetchUserFiles(user.id);
    }
  }, [user?.id]);


  const fetchUserFiles = async (userId: string) => {
    try {
      const res = await axios.get<[]>(`https://ofsbe-production.up.railway.app/users/${userId}/files`);
      const fetchedFiles: FileMeta[] = [];

      for (const file of res.data) {
        try {
          const response = await axios.get<FileMeta>(`http://localhost:2518/files/${file}/meta`);
          fetchedFiles.push(response.data);
          // Ensure the id is set
        } catch (error) {
          console.error(`Error fetching metadata for file ${file}:`, error);
        }
      }

      setTile(fetchedFiles); // ✅ update state
    } catch (error) {
      console.error("Error fetching user files:", error);
    }
  };

  function getFileSizeFromBase64(base64: string): number {
    const padding = (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    return Math.floor(base64.length * 3 / 4) - padding; // in bytes
  }

  // fetchUserFiles(user?.id || '');


  const filteredFiles = tile
    .filter(file =>
      file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(file => {
      if (privacyFilter === 'all') return true;
      return file.public === (privacyFilter === 'public');
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'size':
          comparison = getFileSizeFromBase64(a.data) - getFileSizeFromBase64(b.data);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleCopyLink = async (link: string) => {
    if (user?.id) fetchUserFiles(user.id); // Example userId
    console.log('files:', files);
    console.log('filteredFiles:', filteredFiles);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      const y= await axios.delete(`https://ofsbe-production.up.railway.app/users/deletefile/${id}`);
      if(y.data==true){
        const res = await axios.delete(`https://ofsbe-production.up.railway.app/files/${id}?email=${user?.email}`);

        if(res.status===200){
          alert('File deleted successfully');
          setTile(prev => prev.filter(f => f.id !== new Number(id))) ;
        }
      }else
        alert('Error deleting file');
      
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const publicFiles = files.filter(f => f.privacy === 'public').length;
  const privateFiles = files.filter(f => f.privacy === 'private').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">My Files</h1>
          <p className="text-lg text-gray-600">
            Manage and share your uploaded files
          </p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Your Files URL:</strong>
            </p>
            <div className="flex items-center space-x-2">
              <code className="bg-white px-3 py-2 rounded border text-sm text-blue-900 flex-1 break-all">
                {getUserFilesUrl()}
              </code>
              <button
                onClick={() => handleCopyLink(getUserFilesUrl())}
                className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Share this URL to let others see your public files
            </p>
          </div>
          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <span className="bg-white px-3 py-1 rounded-full shadow-sm">
                {files.length} file{files.length !== 1 ? 's' : ''}
              </span>
              <span className="bg-white px-3 py-1 rounded-full shadow-sm flex items-center space-x-1">
                <Globe className="h-3 w-3 text-green-600" />
                <span>{publicFiles} public</span>
              </span>
              <span className="bg-white px-3 py-1 rounded-full shadow-sm flex items-center space-x-1">
                <Lock className="h-3 w-3 text-red-600" />
                <span>{privateFiles} private</span>
              </span>
              <span className="bg-white px-3 py-1 rounded-full shadow-sm">
                {formatFileSize(totalSize)} total
              </span>
            </div>
          )}
        </motion.div>

        {/* Controls */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Sort Controls */}
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={privacyFilter}
                  onChange={(e) => setPrivacyFilter(e.target.value as 'all' | 'public' | 'private')}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Files</option>
                  <option value="public">Public Only</option>
                  <option value="private">Private Only</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="size">Sort by Size</option>
                </select>
                <button
                  onClick={toggleSortOrder}
                  className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-5 w-5 text-gray-600" />
                  ) : (
                    <SortDesc className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Files Grid */}
        {filteredFiles.length > 0 ? (

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <FileCard
                  file={file}
                  onCopyLink={handleCopyLink}
                  onDelete={handleDeleteFile}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              {searchTerm ? (
                <Search className="h-12 w-12 text-gray-400" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {searchTerm ? 'No files found' : 'No files uploaded yet'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm
                ? `No files match "${searchTerm}". Try adjusting your search terms.`
                : 'Start by uploading your first file to share it with others.'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/upload')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
              >
                <Upload className="h-5 w-5" />
                <span>Upload Your First File</span>
              </button>
            )}
          </motion.div>
        )}

        {/* Copy Success Toast */}
        {copiedLink && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 z-50"
          >
            <Check className="h-5 w-5" />
            <span className="font-medium">URL copied to clipboard!</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyFiles;
