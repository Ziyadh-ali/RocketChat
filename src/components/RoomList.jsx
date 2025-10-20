import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDirectMessages, getUsers, createDirectMessage } from '../services/rocketchat';
import Autocomplete from './AutoComplete';

const RoomList = ({ rooms, currentRoom, onRoomSelect, activeTab }) => {
  const { authToken, userId, user } = useAuth();
  const [directMessages, setDirectMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch direct messages when tab changes
  useEffect(() => {
    const fetchDirectMessages = async () => {
      if (activeTab !== 'direct' || !authToken || !userId) return;
      setLoading(true);
      try {
        const result = await getDirectMessages(authToken, userId);
        console.log('DMs loaded:', result);
        if (result.success) {
          const roomsWithMessages = result.rooms.filter(room => room.lm);
          setDirectMessages(roomsWithMessages);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to fetch direct messages');
        console.error('Failed to fetch DMs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDirectMessages();
  }, [activeTab, authToken, userId]);

  // Debounced useEffect for fetching users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setAvailableUsers([]);
        return;
      }
      try {
        const result = await getUsers(authToken, userId, searchQuery);
        if (result.success) {
          const dmUsernames = directMessages.map(room => 
            room.usernames?.find(u => u !== user?.username) || ''
          ).filter(Boolean);
          console.log('Excluding DM users:', dmUsernames);
          setAvailableUsers(
            result.users
              .filter(u => u.username !== user?.username && !dmUsernames.includes(u.username))
              .map(u => ({
                username: u.username,
                name: u.name || u.username,
              }))
          );
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to fetch users');
        console.error('Failed to fetch users:', err);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, authToken, userId, user, directMessages]);

  const handleCreateDM = async (username) => {
    try {
      const result = await createDirectMessage(username, authToken, userId);
      console.log('Create DM result:', result);
      if (result.success) {
        // Refresh direct messages to include the new one
        const refreshedResult = await getDirectMessages(authToken, userId);
        if (refreshedResult.success) {
          setDirectMessages(refreshedResult.rooms.filter(room => room.lm));
        }
        // Select the new room immediately
        const newRoom = result.room || refreshedResult.rooms.find(r => r.usernames?.includes(username));
        if (newRoom) {
          onRoomSelect(newRoom);
        }
        // Clear search
        setSearchQuery('');
        setAvailableUsers([]);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create direct message');
      console.error('Create DM error:', err);
    }
  };

  const filteredRooms = activeTab === 'channels'
    ? rooms.filter(room => room.t === 'c')
    : directMessages;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
        <h3 className="text-white text-base font-semibold m-0">
          {activeTab === 'channels' ? 'Channels' : 'Direct Messages'}
        </h3>
        <span className="bg-rose-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
          {filteredRooms.length}
        </span>
      </div>

      {activeTab === 'direct' && (
        <div className="p-4">
          <Autocomplete
            options={availableUsers.map(u => u.username)}
            value={[]}  // Keep empty for single-select feel
            onChange={(selected) => {
              if (selected.length > 0) {
                handleCreateDM(selected[0]);
              }
            }}
            onInputChange={(value) => setSearchQuery(value)}
            placeholder="Search users to message..."
            renderOption={(option) => {
              const matchedUser = availableUsers.find(u => u.username === option);
              // FIXED: Show only the name prominently, with username in parens
              return matchedUser ? `${matchedUser.name} (@${matchedUser.username})` : option;
            }}
          />
          {error && (
            <p className="text-red-400 text-xs mt-2">{error}</p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 py-2">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-4 border-gray-700 border-t-rose-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex justify-center items-center h-48 text-gray-400 text-sm">
            <p>{activeTab === 'channels' ? 'No channels available' : 'No recent direct messages'}</p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div
              key={room._id}
              className={`flex items-center p-3 mx-2 cursor-pointer transition-colors duration-200 border-l-3 border-transparent rounded-lg ${
                currentRoom?._id === room._id
                  ? 'bg-rose-500/20 border-l-rose-500'
                  : 'hover:bg-gray-700'
              }`}
              onClick={() => onRoomSelect(room)}
            >
              <div className="w-8 h-8 rounded-md bg-rose-500 text-white flex items-center justify-center font-semibold text-sm mr-3 flex-shrink-0">
                {room.t === 'c' ? '#' : '@'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm mb-0.5 truncate">
                  {room.t === 'd'
                    ? `@${room.usernames?.find(u => u !== user?.username) || room.fname || 'Unknown'}`
                    : `#${room.name || room.fname || 'Unnamed Room'}`}
                </div>
                <div className="text-gray-400 text-xs truncate">
                  {room.topic || room.lastMessage?.msg || 'No recent messages'}
                </div>
              </div>
              {room.unread > 0 && (
                <div className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs font-semibold min-w-[18px] text-center ml-2">
                  {room.unread}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;