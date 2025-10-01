import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { File, FileText, Image, Video, Music, Archive, Globe, Lock, User, ArrowLeft, Search, Calendar, HardDrive } from 'lucide-react';
import { FileItem, FileMeta } from '../types';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PublicFiles: React.FC = () => {
  const { user } = useAuth();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userExists, setUserExists] = useState(true);
  const [tile, setTile] = useState<FileMeta[]>([]);
  const [publicFiles, setPublicFiles] = useState(0);

  useEffect(() => {
    const loadUserFiles = async () => {
      setLoading(true);

      try {
        const savedUser = localStorage.getItem('user');
        const currentUser = savedUser ? JSON.parse(savedUser) : null;
        if (!user?.email) {
          setUserExists(false);

          console.warn("No user found in localStorage");
          setLoading(false);
          return;
        }
        setUserExists(true);

        const res = await axios.get<FileMeta[]>(
          `http://localhost:2518/files/username/${username}/files`,
          { params: { mail: user?.email } }
        );

        // ✅ update state with files
        console.log(res.data);

        setTile(res.data);
        setPublicFiles(res.data.filter(file => file.public).length);
      } catch (err) {
        console.error("Error fetching user files:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserFiles();
  }, [username]);

  function getFileSizeFromBase64(base64: string): number {
    const padding = (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    return Math.floor(base64.length * 3 / 4) - padding; // in bytes
  }


  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-600" />;
    if (type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-600" />;
    if (type.startsWith('audio/')) return <Music className="h-8 w-8 text-green-600" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-8 w-8 text-red-600" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-8 w-8 text-orange-600" />;
    return <File className="h-8 w-8 text-gray-600" />;
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

  const filteredFiles = tile.filter(file =>
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSize = tile.reduce((acc, file) => acc + getFileSizeFromBase64(file.data), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {username}'s files...</p>
        </div>
      </div>
    );
  }

  if (!userExists) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="bg-red-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <User className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-6">
            The user "{username}" doesn't exist or has no public files to display.
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              {username}'s Public Files
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Browse and download publicly shared files
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Found via global search • Public files only
          </p>

          {tile.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <span className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center space-x-2">
                <Globe className="h-4 w-4 text-green-600" />
                <span>{publicFiles} public file{publicFiles !== 1 ? 's' : ''}</span>
              </span>
              {tile.length !== publicFiles && (
                <span className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-red-600" />
                  <span>{tile.length - publicFiles} private file{tile.length - publicFiles !== 1 ? 's' : ''}</span>
                </span>
              )}
              <span className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-blue-600" />
                <span>{formatFileSize(totalSize)} total</span>
              </span>
            </div>
          )}
        </motion.div>

        {/* Search */}
        {tile.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100"
          >
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
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
                <Link to={`/${username}/files/${file.id}`}
                  className="block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {getFileIcon(file.fileType)}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors" title={file.fileName}>
                          {file.fileName}
                        </h3>
                        <p className="text-xs text-gray-500">{formatFileSize(getFileSizeFromBase64(file.data))}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded-full ${file.public ? 'bg-green-100' : 'bg-red-100'}`} title={file.public ? "Public file" : "Private file"}>
                        {file.public ? <Globe className="h-3 w-3 text-green-600" /> : <Lock className="h-3 w-3 text-red-600" />}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Uploaded {formatDate(new Date(file.date))}</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-sm text-blue-600 group-hover:text-blue-700 font-medium">
                      Click to view/download →
                    </span>
                  </div>
                </Link>
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
                <Globe className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {searchTerm ? 'No files found' : 'No public files'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm
                ? `No files match "${searchTerm}". Try adjusting your search terms.`
                : `${username} hasn't shared any public files yet, or this user doesn't exist.`
              }
            </p>
          </motion.div>
        )}

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link
            to="/home"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to FileShare</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicFiles;