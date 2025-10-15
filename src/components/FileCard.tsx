import React from 'react';
import { motion } from 'framer-motion';
import { File, Download, Link2, Trash2, FileText, Image, Video, Music, Archive, Lock, Globe, Users } from 'lucide-react';
import { FileItem, FileMeta } from '../types';
import { useAuth } from '../context/AuthContext';

interface FileCardProps {
  file: FileMeta;
  onCopyLink: (link: string) => void;
  onDelete: (id: string) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onCopyLink, onDelete }) => {
  const { user } = useAuth();
  // console.log(file);
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

  const handleDownload = () => {
    // Mock download functionality
    const url = `https://ofsbe-production.up.railway.app/files/${file.id}?mail=${user?.email}`;


    
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.click();
    
    // Show download notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = `Downloading ${file.fileName}...`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {getFileIcon(file.fileType || file.fileType)}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate" title={file.fileName}>
              {file.fileName}
            </h3>
            <p className="text-xs text-gray-500">{formatFileSize(getFileSizeFromBase64(file.data))}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Privacy Indicator */}
          <div className={`p-1 rounded-full ${file.public ? 'bg-green-100' : 'bg-red-100'}`} title={file.public ? 'Public file' : 'Private file'}>
            {file.public ? (
              <Globe className="h-3 w-3 text-green-600" />
            ) : (
              <Lock className="h-3 w-3 text-red-600" />
            )}
          </div>
          {/* Delete Button */}
          <button
            onClick={() => onDelete(file.id.toString())}
            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
            title="Delete file"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Privacy Info */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          {file.public ? (
            <>
              <Globe className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Public</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Private</span>
            </>
          )}
        </div>

        {!file.public && file.allowedEmails && file.allowedEmails.length > 0 && (
          <div className="text-xs text-gray-600 flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{file.allowedEmails.length} user{file.allowedEmails.length !== 1 ? 's' : ''} allowed</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Uploaded on</p>
        <p className="text-sm text-gray-700">{formatDate(new Date(file.date))}</p>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onCopyLink(`${window.location.origin}/${user?.username || 'anonymous'}/files/${encodeURIComponent(file.id)}`)}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
          title="Copy file URL"
        >
          <Link2 className="h-4 w-4" />
          <span>Copy URL</span>
        </button>
        <button
          onClick={handleDownload}
          className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          title="Download file"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default FileCard;
