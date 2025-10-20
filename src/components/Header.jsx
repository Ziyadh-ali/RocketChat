import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { changeStatus } from '../services/rocketchat';
import ProfileModal from './ProfileModal'; // We'll create this next
import { Search } from 'lucide-react';
import SearchModal from './SearchModal';

const Header = ({ showBackButton = false, onBack }) => {
  const { user, logout, authToken, updateUser, userId } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(user?.status || 'offline');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const statusColors = {
    online: 'text-green-400',
    offline: 'text-gray-400',
    away: 'text-yellow-400',
    busy: 'text-red-400',
  };

  useEffect(() => {
    if (user?.status) {
      setStatus(user.status);
    }
  }, [user?.status]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStatusChange = async (newStatus) => {
    if (!authToken || !user?._id || newStatus === status) return;

    setIsUpdating(true);
    setDropdownOpen(false);

    try {
      const result = await changeStatus(newStatus, authToken, user._id);
      if (result.success) {
        const updateResult = await updateUser();
        if (updateResult.success) {
          setStatus(newStatus);
          console.log(`Status updated to: ${newStatus}`);
        } else {
          console.error('Failed to sync user data:', updateResult.error);
          setStatus(status);
        }
      } else {
        console.error('Status change failed:', result.error);
      }
    } catch (err) {
      console.error('Unexpected status change error:', err);
      setStatus(status);
    } finally {
      setIsUpdating(false);
    }
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get user avatar URL or generate initials
  const getAvatarUrl = () => {
    if (user?.avatarUrl) {
      return user.avatarUrl;
    }
    return null;
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="flex items-center">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="mr-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 12H5M12 19L5 12L12 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-4">
            {/* Profile Picture with Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-semibold text-sm relative">
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getUserInitials()
                  )}
                  {/* Online Status Indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${status === 'online' ? 'bg-green-500' :
                    status === 'away' ? 'bg-yellow-500' :
                      status === 'busy' ? 'bg-red-500' :
                        'bg-gray-500'
                    }`} />
                </div>
                <div className="text-left">
                  <span className="text-white font-semibold text-base block">
                    {user?.name || user?.username || 'User'}
                  </span>
                  <span className={`text-xs ${statusColors[status] || 'text-gray-400'}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              </button>

              {profileDropdownOpen && (
                <div className="absolute left-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-48 z-20">
                  <div className="p-2">
                    <div
                      onClick={() => {
                        setShowProfileModal(true);
                        setProfileDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-rose-500 rounded cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Edit Profile
                    </div>

                    {/* Status Selector in Profile Dropdown */}
                    <div className="border-t border-gray-700 mt-2 pt-2">
                      <div className="px-3 py-1 text-xs text-gray-400 uppercase font-semibold">
                        Status
                      </div>
                      {['online', 'away', 'busy', 'offline'].map((s) => (
                        <div
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={`flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-rose-500 rounded cursor-pointer ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${s === 'online' ? 'bg-green-500' :
                            s === 'away' ? 'bg-yellow-500' :
                              s === 'busy' ? 'bg-red-500' :
                                'bg-gray-500'
                            }`} />
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                          {status === s && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="ml-auto">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-700 mt-2 pt-2">
                      <div
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-red-500 rounded cursor-pointer"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mr-4">
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition"
            title="Global Search (Ctrl+K)"
          >
            <Search size={18} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={isUpdating}
              className={`${statusColors[status] || 'text-gray-400'} text-xs px-3 py-1 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUpdating ? 'Updating...' : (status.charAt(0).toUpperCase() + status.slice(1))} ▾
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-md w-40 z-10">
                {['online', 'away', 'busy', 'offline'].map((s) => (
                  <div
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`px-4 py-2 text-sm text-white hover:bg-rose-500 cursor-pointer ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg shadow-md px-4 py-2 transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        authToken={authToken}
        userId={userId}
        onProfileUpdated={updateUser}
      />

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
};

export default Header;