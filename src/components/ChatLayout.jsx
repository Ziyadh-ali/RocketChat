import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getRooms, getMessages, deleteChat, pinMessage, unPinMessage,
  getRoomMembers, updateMessage, connectStream, searchMessages, createDirectMessage
} from '../services/rocketchat';
import Header from './Header';
import RoomList from './RoomList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Users, Info, Search, Pin } from 'lucide-react';
import SideModal from './SideModal';
import { useLocation } from 'react-router-dom';

const ChatLayout = () => {
  const { authToken, userId, user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [otherUserStatus, setOtherUserStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('channels');
  const [activeModal, setActiveModal] = useState(null);
  const [streamConnected, setStreamConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const location = useLocation();

  // Load rooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      if (!authToken || !userId) return;

      try {
        const result = await getRooms(authToken, userId);
        if (result.success) {
          setRooms(result.rooms);

          // Set default room based on active tab
          const channels = result.rooms.filter(room => room.t === 'c' || room.t === 'p');
          const directMessages = result.rooms.filter(room => room.t === 'd');

          if (activeTab === 'channels' && channels.length > 0) {
            setCurrentRoom(channels[0]);
          } else if (activeTab === 'direct' && directMessages.length > 0) {
            setCurrentRoom(directMessages[0]);
          } else if (result.rooms.length > 0) {
            setCurrentRoom(result.rooms[0]);
          }
        } else {
          setError(result.error);
        }
      } catch {
        setError('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [authToken, userId, activeTab]);

  // Load messages and members for selected room
  useEffect(() => {
    const loadRoomData = async () => {
      if (!currentRoom || !authToken || !userId) return;

      try {
        const roomType = currentRoom.t === 'd' ? 'im' : 'channel';

        const result = await getMessages(currentRoom._id, authToken, userId, roomType);
        if (result.success) {
          const normalMessages = result.messages
            .filter(msg => !msg.t || msg.t === 'uj' || msg.t === 'message')
            .reverse();

          setMessages(normalMessages);
        } else {
          setError(result.error);
        }

        const membersResult = await getRoomMembers(currentRoom._id, authToken, userId, roomType);
        if (membersResult.success) {
          setRoomMembers(membersResult.members);

          if (currentRoom.t === 'd') {
            const otherMember = membersResult.members.find(m => m._id !== userId);
            if (otherMember) {
              setOtherUserStatus(otherMember.status || 'offline');
            } else {
              setOtherUserStatus('offline');
            }
          } else {
            setOtherUserStatus('');
          }
        } else {
          console.error('Failed to load members:', membersResult.error);
        }
      } catch {
        setError('Failed to load room data');
      }
    };

    loadRoomData();
  }, [currentRoom, authToken, userId]);

  // Real-time stream for messages and updates
  useEffect(() => {
    if (!currentRoom || !authToken || !userId) return;

    const unsubscribe = connectStream(
      currentRoom._id,
      authToken,
      userId,
      (event) => {
        const { type, message } = event;
        setStreamConnected(true);

        setMessages((prev) => {
          switch (type) {
            case 'inserted':
              if (!message.t || message.t === 'message') {
                return [...prev, message];
              }
              return prev;

            case 'updated':
              return prev.map((m) =>
                m._id === message._id ? { ...m, ...message } : m
              );

            case 'removed':
              return prev.filter((m) => m._id !== message._id);

            case 'stream_error':
              setStreamConnected(false);
              return prev;

            default:
              return prev;
          }
        });
      }
    );

    return () => {
      unsubscribe();
      setStreamConnected(false);
    };
  }, [currentRoom?._id, authToken, userId, currentRoom]);

  // Fallback polling (every 30s)
  useEffect(() => {
    if (!currentRoom || !authToken || !userId || streamConnected) return;

    const roomType = currentRoom.t === 'd' ? 'im' : 'channel';

    const pollMessages = async () => {
      try {
        const result = await getMessages(currentRoom._id, authToken, userId, roomType);
        if (result.success) {
          const normalMessages = result.messages
            .filter(msg => !msg.t || msg.t === 'uj' || msg.t === 'message')
            .reverse();

          setMessages(prev => {
            const hasChanges = normalMessages.length !== prev.length ||
              normalMessages.some((newMsg, i) => {
                const prevMsg = prev[i];
                return !prevMsg ||
                  newMsg._id !== prevMsg._id ||
                  newMsg.msg !== prevMsg.msg ||
                  newMsg.editedAt !== prevMsg.editedAt ||
                  JSON.stringify(newMsg.reactions) !== JSON.stringify(prevMsg?.reactions);
              });

            if (hasChanges) {
              return normalMessages;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Error polling messages:', err);
      }
    };

    const interval = setInterval(pollMessages, 30000);
    return () => clearInterval(interval);
  }, [currentRoom, authToken, userId, streamConnected]);

  // NEW: Message search (debounced)
  useEffect(() => {
    if (!searchQuery || !currentRoom || !authToken || !userId) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    const debounce = setTimeout(async () => {
      try {
        const result = await searchMessages(currentRoom._id, searchQuery, authToken, userId);
        if (result.success) {
          setSearchResults(result.messages);
          setSearchError('');
        } else {
          setSearchError(result.error);
          setSearchResults([]);
        }
      } catch {
        setSearchError('Failed to search messages');
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchQuery, currentRoom, authToken, userId]);

  const handleUpdateReaction = (msgId, updatedReactions) => {
    setMessages(prev =>
      prev.map(m => (m._id === msgId ? { ...m, reactions: updatedReactions } : m))
    );
  };

  const handleRoomSelect = room => {
    setCurrentRoom(room);
    setMessages([]);
    setRoomMembers([]);
    setSearchQuery('');  // Clear search when changing rooms

    // Update active tab based on room type
    if (room.t === 'c' || room.t === 'p') {
      setActiveTab('channels');
    } else if (room.t === 'd') {
      setActiveTab('direct');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // Select appropriate room when changing tabs
    if (tab === 'channels') {
      const channels = rooms.filter(room => room.t === 'c' || room.t === 'p');
      if (channels.length > 0) {
        setCurrentRoom(channels[0]);
      }
    } else if (tab === 'direct') {
      const directMessages = rooms.filter(room => room.t === 'd');
      if (directMessages.length > 0) {
        setCurrentRoom(directMessages[0]);
      }
    }
  };

  const handleNewMessage = message => {
    const actualMessage = message.message || message;
    setMessages(prev => [...prev, actualMessage]);
  };

  const handleLogout = () => logout();
  const handleBackToDashboard = () => navigate('/dashboard');

  const handleDeleteMessage = async msg => {
    if (!currentRoom) return;
    try {
      const result = await deleteChat(currentRoom._id, authToken, userId, msg._id);
      if (result.success) {
        setMessages(prev => prev.filter(m => m._id !== msg._id));
      } else {
        alert(result.error);
      }
    } catch {
      alert('Failed to delete message');
    }
  };

  const handlePinMessage = async (msg, action) => {
    try {
      const result =
        action === 'pin'
          ? await pinMessage(authToken, userId, msg._id)
          : await unPinMessage(authToken, userId, msg._id);

      if (result.success) {
        setMessages(prev =>
          prev.map(m => (m._id === msg._id ? { ...m, pinned: action === 'pin' } : m))
        );
        alert(`Message ${action}ned successfully`);
      } else {
        alert(result.error);
      }
    } catch {
      alert('Failed to pin/unpin message');
    }
  };

  const handleUpdateMessage = async (msg, newText) => {
    if (!currentRoom) return;
    try {
      const result = await updateMessage(currentRoom._id, msg._id, newText, authToken, userId);
      if (result.success) {
        setMessages(prev =>
          prev.map(m => m._id === msg._id ? { ...m, msg: newText, editedAt: new Date().toISOString() } : m)
        );
      } else {
        console.log(result.error);
        alert(result.error);
      }
    } catch {
      console.log("error");
      alert('Failed to update message');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && e.getModifierState('Control')) {
        e.preventDefault();
        setActiveModal("search");
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Scroll to message
  useEffect(() => {
    const handleScrollToMessage = (e) => {
      console.log('ChatLayout: Scrolling to message ID:', e.detail); // DEBUG
      setTimeout(() => {
        const messageEl = document.querySelector(`[data-message-id="${e.detail}"]`);
        if (messageEl) {
          messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          messageEl.style.backgroundColor = 'rgba(234, 179, 8, 0.2)';
          messageEl.style.borderLeft = '4px solid #eab308';
          setTimeout(() => {
            messageEl.style.backgroundColor = '';
            messageEl.style.borderLeft = '';
          }, 3000);
        } else {
          console.log('Message not found - current messages:', messages.length);
        }
      }, 1000); // Extra time for messages to load
    };
    window.addEventListener('scrollToMessage', handleScrollToMessage);
    return () => window.removeEventListener('scrollToMessage', handleScrollToMessage);
  }, [messages]);

  // Select room
  useEffect(() => {
    const handleSelectRoom = (e) => {
      console.log('ChatLayout: Selecting room ID:', e.detail); // DEBUG
      const targetRoom = rooms.find(room => room._id === e.detail);
      if (targetRoom) {
        setCurrentRoom(targetRoom);
        if (targetRoom.t === 'c' || targetRoom.t === 'p') setActiveTab('channels');
        else if (targetRoom.t === 'd') setActiveTab('direct');
        console.log('Room selected:', targetRoom.name);
      } else {
        console.log('Room not found in list:', rooms.map(r => r._id));
      }
    };
    window.addEventListener('selectRoom', handleSelectRoom);
    return () => window.removeEventListener('selectRoom', handleSelectRoom);
  }, [rooms]);

  useEffect(() => {
    const handleCreateDM = async (e) => {
      console.log('ChatLayout: Creating DM with:', e.detail);
      const username = e.detail;
      if (!username) {
        console.log('No username provided for DM');
        return;
      }

      // Check existing rooms (spotlight users have 'username')
      const existingDM = rooms.find(room =>
        room.t === 'd' && room.usernames?.includes(username)
      );

      if (existingDM) {
        console.log('Opening existing DM:', existingDM.name);
        setCurrentRoom(existingDM);
        setActiveTab('direct');
      } else {
        try {
          console.log('Creating new DM for:', username);
          const result = await createDirectMessage(username, authToken, userId);
          if (result.success) {
            // Refresh rooms to include new DM
            const refreshed = await getRooms(authToken, userId);
            if (refreshed.success) {
              setRooms(refreshed.rooms);
              const newRoom = refreshed.rooms.find(r =>
                r.t === 'd' && r.usernames?.includes(username)
              );
              if (newRoom) {
                setCurrentRoom(newRoom);
                setActiveTab('direct');
                console.log('New DM opened:', newRoom.name);
              }
            }
          } else {
            console.log('DM creation failed:', result.error);
          }
        } catch (err) {
          console.error('DM error:', err);
        }
      }
    };
    window.addEventListener('createDM', handleCreateDM);
    return () => window.removeEventListener('createDM', handleCreateDM);
  }, [rooms, authToken, userId]);

  useEffect(() => {
    const handleNavigationState = async () => {
      const { targetRoomId, targetMessageId, targetUsername } = location.state || {};

      if (targetRoomId) {
        let targetRoom = rooms.find(room => room._id === targetRoomId);

        if (!targetRoom) {
          // Refresh rooms if not found (e.g., new DM)
          const refreshed = await getRooms(authToken, userId);
          if (refreshed.success) {
            setRooms(refreshed.rooms);
            targetRoom = refreshed.rooms.find(room => room._id === targetRoomId);
          }
        }

        if (targetRoom) {
          if (targetRoom.t === 'c' || targetRoom.t === 'p') {
            setActiveTab('channels');
          } else if (targetRoom.t === 'd') {
            setActiveTab('direct');
          }

          setCurrentRoom(targetRoom);

          if (targetMessageId) {
            const scrollToMsg = () => {
              const messageEl = document.querySelector(`[data-message-id="${targetMessageId}"]`);
              if (messageEl) {
                messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                messageEl.style.backgroundColor = 'rgba(234, 179, 8, 0.2)';
                messageEl.style.borderLeft = '4px solid #eab308';
                setTimeout(() => {
                  messageEl.style.backgroundColor = '';
                  messageEl.style.borderLeft = '';
                }, 3000);
              } else {
                setTimeout(scrollToMsg, 500);
              }
            };
            setTimeout(scrollToMsg, 1000);
          }
        }
      } else if (targetUsername) {
        const existingDM = rooms.find(room =>
          room.t === 'd' && room.usernames?.includes(targetUsername)
        );

        if (existingDM) {
          setCurrentRoom(existingDM);
          setActiveTab('direct');
        } else {
          const result = await createDirectMessage(targetUsername, authToken, userId);
          if (result.success) {
            const refreshed = await getRooms(authToken, userId);
            if (refreshed.success) {
              setRooms(refreshed.rooms);
              const newRoom = refreshed.rooms.find(r =>
                r.t === 'd' && r.usernames?.includes(targetUsername)
              );
              if (newRoom) {
                setCurrentRoom(newRoom);
                setActiveTab('direct');
              }
            }
          }
        }
      }

      if (location.state) {
        navigate(location.pathname, { replace: true, state: null });
      }
    };

    handleNavigationState();
  }, [location.state, rooms, authToken, userId, navigate , location.pathname]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 items-center justify-center text-gray-400">
        <div className="w-10 h-10 border-4 border-gray-700 border-t-rose-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm">Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 items-center justify-center text-gray-400 p-5 text-center">
        <h2 className="text-red-400 text-lg font-semibold mb-4">Error</h2>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg shadow-md px-6 py-3 transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header
        user={user}
        onLogout={handleLogout}
        showBackButton
        onBack={handleBackToDashboard}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/4 min-w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => handleTabChange('channels')}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${activeTab === 'channels'
                ? 'bg-rose-500/20 text-rose-400 border-b-2 border-rose-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              Channels
            </button>
            <button
              onClick={() => handleTabChange('direct')}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${activeTab === 'direct'
                ? 'bg-rose-500/20 text-rose-400 border-b-2 border-rose-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              Direct Messages
            </button>
          </div>

          <RoomList
            rooms={rooms}
            currentRoom={currentRoom}
            onRoomSelect={handleRoomSelect}
            activeTab={activeTab}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {currentRoom ? (
            <>
              {/* Top Bar */}
              <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="text-white text-lg font-semibold mb-1 flex items-center gap-2">
                    {currentRoom.t === 'd' ? (
                      <span>@{(currentRoom.usernames?.find(u => u !== user?.username) || currentRoom.name || 'Unknown')}</span>
                    ) : (
                      <span>#{currentRoom.name}</span>
                    )}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {currentRoom.t === 'd'
                      ? (otherUserStatus ? `${otherUserStatus.charAt(0).toUpperCase() + otherUserStatus.slice(1)}` : 'Offline')
                      : (currentRoom.topic || 'No topic set')
                    }
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    title="Members"
                    onClick={() => setActiveModal("members")}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition"
                  >
                    <Users size={18} />
                  </button>
                  <button
                    title="Room Info"
                    onClick={() => setActiveModal("info")}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition"
                  >
                    <Info size={18} />
                  </button>
                  <button
                    title="Search Messages"
                    onClick={() => setActiveModal("search")}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition"
                  >
                    <Search size={18} />
                  </button>
                  <button
                    title="Pinned Messages"
                    onClick={() => setActiveModal("pinned")}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition"
                  >
                    <Pin size={18} />
                  </button>
                </div>
              </div>

              {/* Message List */}
              <MessageList
                messages={messages}
                currentUserId={userId}
                onDeleteMessage={handleDeleteMessage}
                pinMessage={handlePinMessage}
                onUpdateMessage={handleUpdateMessage}
                onUpdateReaction={handleUpdateReaction}
                currentRoom={currentRoom}
              />

              {/* Message Input */}
              <MessageInput
                roomId={currentRoom._id}
                onNewMessage={handleNewMessage}
              />
            </>
          ) : (
            // Empty state (no room selected)
            <div className="flex flex-col justify-center items-center h-full text-gray-400 text-center">
              <h3 className="text-white text-xl font-semibold mb-2">
                No chat selected
              </h3>
              <p className="text-sm mb-4">
                Choose a room from the sidebar to view messages
              </p>
              <div className="opacity-50 pointer-events-none">
                <div className="bg-gray-800 rounded-lg p-3 w-96 h-16 flex items-center justify-center border border-gray-700">
                  <span className="text-gray-500 text-sm">
                    Message input disabled
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <SideModal
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === "members"
            ? "Room Members"
            : activeModal === "info"
              ? "Room Information"
              : activeModal === "search"
                ? "Search Messages"
                : activeModal === "pinned"
                  ? "Pinned Messages"
                  : ""
        }
      >
        {activeModal === "members" && (
          <div>
            <p className="text-sm text-gray-400 mb-2">
              Members of this room ({roomMembers.length}):
            </p>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {roomMembers.length > 0 ? (
                roomMembers.map((member) => (
                  <li
                    key={member._id}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm flex items-center justify-between"
                  >
                    <span>
                      <span className="text-gray-300">@{member.username || member.name || 'Unknown'}</span>
                      {member.status && (
                        <span className={`ml-2 px-1 py-0.5 rounded-full text-xs ${member.status === 'online' ? 'bg-green-500' : member.status === 'away' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                          {member.status}
                        </span>
                      )}
                    </span>
                    {member._id === userId && (
                      <span className="text-rose-400 text-xs">(You)</span>
                    )}
                  </li>
                ))
              ) : (
                <li className="p-2 text-gray-400 text-sm text-center">No members found</li>
              )}
            </ul>
          </div>
        )}
        {activeModal === "info" && (
          <div>
            <h3 className="font-semibold text-white mb-2">Room Details</h3>
            <p><span className="font-medium">Name:</span> {currentRoom.name}</p>
            <p><span className="font-medium">Type:</span> {currentRoom.t === "d" ? "Direct" : "Channel"}</p>
            <p><span className="font-medium">Topic:</span> {currentRoom.topic || "No topic set"}</p>
          </div>
        )}

        {activeModal === "search" && (
          <div>
            <input
              type="text"
              placeholder="Search messages... (simple text search)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 text-gray-200 rounded-lg px-3 py-2 mb-4 outline-none"
              autoFocus
            />
            {searchError && (
              <p className="text-red-400 text-sm mb-2">{searchError}</p>
            )}
            {searchResults.length > 0 ? (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((msg) => (
                  <li key={msg._id} className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-white mb-1">{msg.msg}</p>
                    <p className="text-xs text-gray-400">
                      — {msg.u?.username || "Unknown"} • {new Date(msg.ts).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : searchQuery ? (
              <p className="text-gray-400 text-sm">No results found</p>
            ) : (
              <p className="text-gray-400 text-sm">Search results will appear here...</p>
            )}
          </div>
        )}

        {activeModal === "pinned" && (
          <div>
            <h3 className="font-semibold text-white mb-2">Pinned Messages</h3>
            {messages.filter(m => m.pinned).length > 0 ? (
              <ul className="space-y-2">
                {messages
                  .filter(m => m.pinned)
                  .map(msg => {
                    const isAdminOrOwner = user.roles?.includes("admin") || msg.u?._id === userId;
                    return (
                      <li key={msg._id} className="bg-gray-700 p-2 rounded-lg relative">
                        <p className="text-sm mb-1">{msg.msg}</p>
                        <p className="text-xs text-gray-400">
                          — {msg.u?.username || "Unknown"}
                        </p>
                        {isAdminOrOwner && (
                          <button
                            onClick={() => handlePinMessage(msg, "unpin")}
                            className="absolute top-2 right-2 text-xs text-rose-400 hover:text-rose-300 bg-rose-900/50 px-2 py-1 rounded transition-colors"
                          >
                            Unpin
                          </button>
                        )}
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No pinned messages</p>
            )}
          </div>
        )}
      </SideModal>
    </div>
  );
};

export default ChatLayout;
