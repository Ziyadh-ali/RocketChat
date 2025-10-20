import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Download, Smile, Edit3, Trash2, Pin, Flag, MoreVertical } from 'lucide-react';
import { getUserAvatar} from '../services/rocketchat';

const Message = ({
  message,
  isOwn,
  onDelete,
  pinMessage,
  onUpdate,
  roomId,
}) => {
  const { user, authToken, userId } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.msg);
  const [imageErrors, setImageErrors] = useState({});
  const [attachmentUrls, setAttachmentUrls] = useState({});
  const [avatarUrl, setAvatarUrl] = useState(null);
  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);

  const canShowDropdown = isOwn || user?.roles?.includes('admin');

  useEffect(() => {
    const fetchAvatar = async () => {
      if (message.u?.username) {
        try {
          const response = await getUserAvatar(message.u.username, authToken, userId);
          if (response.success) {
            setAvatarUrl(response.avatarUrl);
          }
        } catch (err) {
          console.error('Failed to fetch avatar:', err);
        }
      }
    };
    fetchAvatar();
  }, [message.u?.username, authToken, userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load attachment URLs
  useEffect(() => {
    const loadAttachmentUrls = async () => {
      if (!message.attachments || message.attachments.length === 0) return;

      const urls = {};
      for (let i = 0; i < message.attachments.length; i++) {
        const attachment = message.attachments[i];
        let url = attachment.image_url || attachment.video_url || attachment.url;

        if (!url && attachment._id && roomId) {
          const baseUrl = import.meta.env.VITE_ROCKETCHAT_URL || '';
          url = `${baseUrl}/file-upload/${roomId}/${attachment._id}`;
        }

        urls[i] = url || '#';
      }

      setAttachmentUrls(urls);
    };

    loadAttachmentUrls();
  }, [message.attachments, roomId]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const startEdit = () => {
    setIsEditing(true);
    setEditText(message.msg);
    setDropdownOpen(false);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(editText.length, editText.length);
    }, 0);
  };

  const saveEdit = async () => {
    if (!editText.trim() || editText === message.msg) {
      cancelEdit();
      return;
    }

    try {
      await onUpdate(message, editText);
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update message');
      console.error('Edit error:', err);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditText(message.msg);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleImageError = (index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const renderAttachment = (attachment, index) => {
    const isImage = attachment.type?.startsWith('image/') || attachment.image_url || /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.title || '');
    const isVideo = attachment.type?.startsWith('video/') || attachment.video_url || /\.(mp4|webm|mov|avi)$/i.test(attachment.title || '');
    const isAudio = attachment.type?.startsWith('audio/') || /\.(mp3|wav|ogg)$/i.test(attachment.title || '');
    const isFile = !isImage && !isVideo && !isAudio;
    
    const attachmentUrl = attachmentUrls[index];

    return (
      <div key={index} className="mt-3 p-4 rounded-xl border transition-all duration-200 bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        {isImage && (
          <div>
            {imageErrors[index] || !attachmentUrl ? (
              <div className="text-sm text-red-400 flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                  <Download size={20} className="text-gray-300" />
                </div>
                <div>
                  <p className="font-medium">Failed to load image</p>
                  <p className="text-xs text-gray-400 mt-1">{attachment.title || 'Unavailable'}</p>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={attachmentUrl}
                  alt={attachment.title || 'Image'}
                  className="max-w-full max-h-80 rounded-lg border border-gray-600/50 object-contain cursor-pointer transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl"
                  onError={() => handleImageError(index)}
                  onClick={() => window.open(attachmentUrl, '_blank')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end justify-center p-4">
                  <button
                    onClick={() => window.open(attachmentUrl, '_blank')}
                    className="text-sm text-white bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-black/70 transition-colors"
                  >
                    View Full Image
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {isVideo && (
          <div>
            {attachmentUrl ? (
              <div className="relative group">
                <video
                  controls
                  src={attachmentUrl}
                  className="max-w-full max-h-80 rounded-lg border border-gray-600/50 object-contain transition-all duration-300 group-hover:shadow-xl"
                  poster={attachment.video_thumb}
                >
                  Your browser does not support the video tag.
                </video>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20 hover:bg-black/70 transition-colors"
                  >
                    Open Video
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-400 flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                  <Download size={20} className="text-gray-300" />
                </div>
                <div>
                  <p className="font-medium">Failed to load video</p>
                  <p className="text-xs text-gray-400 mt-1">{attachment.title || 'Unavailable'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {isAudio && (
          <div className="flex items-center gap-4 p-4 bg-gray-900/30 rounded-lg border border-gray-700/50">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <div className="text-white font-bold text-lg">♪</div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{attachment.title || 'Audio File'}</p>
              <p className="text-xs text-gray-400 mt-1">
                {attachment.description || (attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Audio file')}
              </p>
            </div>
            {attachmentUrl && attachmentUrl !== '#' && (
              <audio controls className="flex-1 max-w-xs">
                <source src={attachmentUrl} type={attachment.type || 'audio/mpeg'} />
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        )}
        
        {isFile && (
          <div className="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg border border-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
                <Download size={20} className="text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{attachment.title || 'File'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {attachment.description || (attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'File')}
                </p>
              </div>
            </div>
            {attachmentUrl && attachmentUrl !== '#' ? (
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white text-sm px-4 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 rounded-lg border border-rose-500/30 transition-all duration-200 hover:from-rose-600 hover:to-rose-700 hover:shadow-lg hover:scale-105"
              >
                Download
              </a>
            ) : (
              <span className="text-sm text-gray-500 px-3 py-2 bg-gray-800/50 rounded-lg">Unavailable</span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isEditing) {
  return (
      <div data-message-id={message._id} className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="flex items-start gap-3 max-w-[85%]">
          {!isOwn && (
            <div className="w-10 h-10 flex-shrink-0 mt-1">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${message.u?.username}'s avatar`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-600 shadow-lg"
                  onError={() => setAvatarUrl(null)}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-gray-300 text-sm font-semibold shadow-lg border-2 border-gray-600">
                  {message.u?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          )}
          <div className={`flex-1 p-5 rounded-2xl relative shadow-2xl backdrop-blur-sm ${isOwn
              ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-br-md'
              : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-100 rounded-bl-md'
            }`}>
            <div className="flex justify-between items-center mb-3">
              <span className={`text-sm font-semibold ${isOwn ? 'text-white/90' : 'text-gray-200'}`}>
            {message.u?.name || message.u?.username || 'Unknown User'}
          </span>
              <span className="text-xs text-white/70 ml-3">{formatTime(message.ts)}</span>
            </div>
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full bg-transparent border-0 resize-none outline-none text-sm leading-relaxed whitespace-pre-wrap text-white placeholder-white/60 min-h-[60px]"
              placeholder="Edit your message..."
              rows={Math.min(editText.split('\n').length + 1, 6)}
              autoFocus
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={saveEdit}
                className="text-sm text-white bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg border border-green-400/30 transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center gap-2"
              >
                <Edit3 size={14} />
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="text-sm text-gray-300 hover:text-white px-4 py-2 bg-gray-600/50 hover:bg-gray-600 rounded-lg border border-gray-500/30 transition-all duration-200 hover:shadow-lg flex items-center gap-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        </div>
    );
  }

  return (
    <div className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="flex items-start gap-3 max-w-[85%] group">
        {!isOwn && (
          <div className="w-10 h-10 flex-shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${message.u?.username}'s avatar`}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-600 shadow-lg"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-gray-300 text-sm font-semibold shadow-lg border-2 border-gray-600">
                {message.u?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        )}
        <div
          className={`p-5 rounded-2xl relative break-words shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:shadow-xl ${isOwn
              ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-br-md'
              : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-100 rounded-bl-md'
            } ${message.pinned ? 'ring-2 ring-yellow-400/30' : ''}`}
        >
          {/* Pinned Indicator */}
          {message.pinned && (
            <div className="absolute -top-2 -left-2 bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Pin size={10} />
              Pinned
        </div>
          )}

          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              {!isOwn && (
                <div className="w-8 h-8 flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${message.u?.username}'s avatar`}
                      className="w-8 h-8 rounded-full object-cover border border-gray-600 shadow-sm"
                      onError={() => setAvatarUrl(null)}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-gray-300 text-xs font-semibold shadow-sm">
                      {message.u?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              )}
              <span className={`text-sm font-semibold ${isOwn ? 'text-white/90' : 'text-gray-200'}`}>
                {message.u?.name || message.u?.username || 'Unknown User'}
              </span>
            </div>
            <div className="flex items-center gap-3 ml-3">
              <span className="text-xs text-white/70 whitespace-nowrap">{formatTime(message.ts)}</span>

              {/* FIXED: Only show dropdown if canShowDropdown is true */}
              {canShowDropdown && (
                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-300" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200"
                    aria-label="Message options"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-8 w-48 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl z-20 py-2">
                      {/* FIXED: Only show Edit for OWN messages */}
                      {isOwn && (
                        <button
                          onClick={() => { startEdit(); }}
                          className="w-full px-4 py-2.5 text-sm text-white hover:bg-rose-500/20 flex items-center gap-3 transition-colors"
                        >
                          <Edit3 size={14} />
                          Edit Message
                        </button>
                      )}
                      
                      {/* FIXED: Only show Delete for OWN messages */}
                      {isOwn && (
                        <button
                          onClick={() => { onDelete?.(message); setDropdownOpen(false); }}
                          className="w-full px-4 py-2.5 text-sm text-white hover:bg-red-500/20 flex items-center gap-3 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete Message
                        </button>
                      )}

                      {/* FIXED: Only show Pin/Unpin for ADMIN users */}
                      {user.roles?.includes("admin") && (
                        !message.pinned ? (
                          <button
                            onClick={() => { pinMessage?.(message, "pin"); setDropdownOpen(false); }}
                            className="w-full px-4 py-2.5 text-sm text-white hover:bg-yellow-500/20 flex items-center gap-3 transition-colors"
                          >
                            <Pin size={14} />
                            Pin Message
                          </button>
                        ) : (
                          <button
                            onClick={() => { pinMessage?.(message, "unpin"); setDropdownOpen(false); }}
                            className="w-full px-4 py-2.5 text-sm text-white hover:bg-yellow-500/20 flex items-center gap-3 transition-colors"
                          >
                            <Pin size={14} />
                            Unpin Message
                          </button>
                        )
                )}
              </div>
                  )}
          </div>
        )}
            </div>
          </div>

          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.msg}
            {message.editedAt && (
              <span className="text-xs text-white/60 block mt-2 italic">
                Edited • {formatDate(message.editedAt)}
              </span>
            )}
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-4 space-y-4">
              {message.attachments.map((attachment, index) => renderAttachment(attachment, index))}
            </div>
          )}

          {/* Reaction Section */}
          
        </div>
      </div>
    </div>
  );
};

export default Message;
