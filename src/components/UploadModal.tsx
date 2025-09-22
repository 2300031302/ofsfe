import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, Lock, Globe, Users } from 'lucide-react';
import { FileItem } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
  file?: FileItem;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, shareLink, file }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Share2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">File Uploaded Successfully!</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Your file has been uploaded and is ready to share. Use the URL below to share it with others:
            </p>
            
            {/* Privacy Information */}
            {file && (
              <div className={`mb-4 p-3 rounded-lg border ${file.privacy === 'private' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {file.privacy === 'private' ? (
                    <>
                      <Lock className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Private File</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Public File</span>
                    </>
                  )}
                </div>
                
                {file.privacy === 'private' && file.allowedEmails && file.allowedEmails.length > 0 && (
                  <div className="text-sm text-gray-700">
                    <div className="flex items-center space-x-1 mb-1">
                      <Users className="h-3 w-3" />
                      <span className="font-medium">Allowed users:</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      {file.allowedEmails.map((email, index) => (
                        <div key={index} className="bg-white px-2 py-1 rounded border">
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-600 mt-2">
                  {file.privacy === 'private' 
                    ? 'Only the specified users can access this file with the URL.'
                    : 'Anyone can access this file through your public files URL.'
                  }
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-4 border">
              <p className="text-sm text-gray-700 break-all font-mono">{shareLink}</p>
            </div>

            <button
              onClick={copyToClipboard}
              className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                copied
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadModal;