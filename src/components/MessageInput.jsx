import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sendMessage, uploadFileToRoom } from '../services/rocketchat';
import { Paperclip } from 'lucide-react';

const MessageInput = ({ roomId, onNewMessage }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { authToken, userId } = useAuth();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || sending) return;
    
    setSending(true);
    setError('');

    try {
      const result = await sendMessage(roomId, message.trim(), authToken, userId);
      
      if (result.success) {
        onNewMessage(result.message);
        setMessage('');
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || sending || uploading) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Maximum 10MB allowed.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadResult = await uploadFileToRoom(roomId, file, authToken, userId, '');
      if (!uploadResult.success) {
        setError(uploadResult.error || 'Failed to upload file');
        return;
      }

      const attachment = {
        title: file.name,
        description: `File: ${file.type}`,
        type: 'file',
        file: {
          upload: true,
        },
        ...uploadResult.fileDetails,
      };

      const messageResult = await sendMessage(roomId, '', authToken, userId, [attachment]);
      if (messageResult.success) {
        onNewMessage(messageResult.message);
      } else {
        setError(messageResult.error || 'Failed to send file');
      }
    } catch  {
      setError('An unexpected error occurred during upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // Add keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700">
      {error && (
        <div className="bg-red-900/20 text-red-400 p-3 rounded-lg mb-3 text-sm border border-red-900/30">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-end bg-gray-900 border border-gray-700 rounded-lg p-3 transition-colors duration-200 focus-within:ring-2 focus-within:ring-rose-500">
          <button
            type="button"
            onClick={handleFileClick}
            disabled={sending || uploading}
            className="mr-2 p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending || uploading}
            className="flex-1 border-none bg-transparent resize-none outline-none text-sm text-white placeholder-gray-400 max-h-32 min-h-5 font-sans px-2 py-1"
            rows="1"
          />
          <button
            type="submit"
            disabled={!message.trim() || sending || uploading}
            className="bg-rose-500 hover:bg-rose-600 disabled:bg-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed text-white rounded-lg w-9 h-9 flex items-center justify-center transition-all duration-200 ml-2 flex-shrink-0 hover:scale-105 disabled:scale-100"
          >
            {sending || uploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;