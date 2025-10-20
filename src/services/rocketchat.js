import axios from 'axios';

const BASE_URL = import.meta.env.VITE_ROCKETCHAT_URL;

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
});


const getAuthHeaders = (authToken, userId) => ({
  'X-Auth-Token': authToken,
  'X-User-Id': userId,
  'Content-Type': 'application/json',
});

// Authentication
export const login = async (username, password) => {
  try {
    const response = await api.post('/login', {
      user: username,
      password: password,
    });

    if (response.data.status === 'success') {
      return {
        success: true,
        authToken: response.data.data.authToken,
        userId: response.data.data.userId,
        user: response.data.data.me,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Login failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Network error during login',
    };
  }
};

// Get user info
export const getUserInfo = async (authToken, userId) => {
  try {
    const response = await api.get('/me', {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      user: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get user info',
    };
  }
};

// Get rooms/channels
export const getRooms = async (authToken, userId) => {
  try {
    const response = await api.get('/rooms.get', {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      rooms: response.data.update || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get rooms',
    };
  }
};

// Get messages for a room (updated to support channels and DMs)
export const getMessages = async (roomId, authToken, userId, roomType = 'channel', count = 50) => {
  try {
    const endpoint = roomType === 'channel' ? '/channels.history' : '/im.history';
    const response = await api.get(`${endpoint}?roomId=${roomId}&count=${count}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      messages: response.data.messages || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get messages',
    };
  }
};

// Get direct messages
export const getDirectMessages = async (authToken, userId, offset = 0, count = 50) => {
  try {
    const response = await api.get(`/im.list?offset=${offset}&count=${count}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      rooms: response.data.ims || [],
      total: response.data.total,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get direct messages',
    };
  }
};

// Create a direct message
export const createDirectMessage = async (username, authToken, userId) => {
  try {
    const response = await api.post('/im.create', { username }, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      room: response.data.room,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create direct message',
    };
  }
};

// Send a message
export const sendMessage = async (roomId, message, authToken, userId, attachments = []) => {
  try {
    const body = {
      message: {
        rid: roomId,
        msg: message,
      },
    };

    if (attachments && attachments.length > 0) {
      body.message.attachments = attachments;
    }

    const response = await api.post('/chat.sendMessage', body, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      message: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to send message',
    };
  }
};

export const pinMessage = async (authToken, userId, messageId) => {
  try {
    await api.post(
      "/chat.pinMessage",
      { messageId },
      {
        headers: getAuthHeaders(authToken, userId),
      }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to pin chat' };
  }
};

export const unPinMessage = async (authToken, userId, messageId) => {
  try {
    await api.post(
      "/chat.unPinMessage",
      { messageId },
      {
        headers: getAuthHeaders(authToken, userId),
      }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to unpin chat' };
  }
};

export const deleteChat = async (roomId, authToken, userId, msgId) => {
  try {
    await api.post(`/chat.delete`, { roomId, msgId }, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to delete chat' };
  }
};



// Get room info
export const getRoomInfo = async (roomId, authToken, userId) => {
  try {
    const response = await api.get(`/rooms.info?roomId=${roomId}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      room: response.data.room,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get room info',
    };
  }
};

// Change status
export const changeStatus = async (status, authToken, userId, facode, method) => {
  try {
    const headers = {
      ...getAuthHeaders(authToken, userId),
      ...(facode && method ? { 'X-2fa-Code': facode, 'X-2fa-Method': method } : {}),
    };
    const response = await api.post('/users.setStatus', { status }, { headers });
    console.log('Status API response:', response.data);

    if (response.data.status === 'success' || !response.data.error) {
      return { success: true };
    } else {
      return { success: false, error: response.data.error || 'Failed to change status' };
    }
  } catch (error) {
    console.error('Status API error:', error.response?.data);
    return { success: false, error: error.response?.data?.error || 'Failed to change status' };
  }
};
// Get room members
export const getRoomMembers = async (roomId, authToken, userId, roomType = 'channel', offset = 0, count = 50) => {
  try {
    const endpoint = roomType === 'channel' ? '/channels.members' : '/im.members';
    const response = await api.get(`${endpoint}?roomId=${roomId}&offset=${offset}&count=${count}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      members: response.data.members || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get room members',
    };
  }
};

// Update messages
export const updateMessage = async (roomId, messageId, msg, authToken, userId) => {
  const body = {
    roomId,
    msgId: messageId,
    text: msg,
  };

  return api.post('/chat.update', body, {
    headers: getAuthHeaders(authToken, userId),
  })
    .then(response => ({
      success: !!response.data.success,
      message: response.data.message,
      error: response.data.error,
    }))
    .catch(error => ({
      success: false,
      error: error.response?.data?.error || 'Failed to update message',
    }));
};

export const createUser = async (userData, authToken, userId) => {
  const { name, username, email, password, verified = false, joinDefaultChannels = true, roles = [] } = userData;

  const body = {
    name,
    username,
    email,
    password,
    verified: verified ? 'true' : 'false',
    joinDefaultChannels: joinDefaultChannels ? 'true' : 'false',
    roles: roles,
  };

  return api.post('/users.create', body, {
    headers: getAuthHeaders(authToken, userId),
  })
    .then(response => ({
      success: !!response.data.success,
      user: response.data.user,
      error: response.data.error,
    }))
    .catch(error => ({
      success: false,
      error: error.response?.data?.error || 'Failed to create user',
    }));
};

export const createChannel = async (name, authToken, userId, description = '', type = 'public', members = []) => {
  try {
    const response = await api.post('/channels.create', {
      name,
      description,
      type: type === 'public' ? false : true,
      members,
    }, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true, room: response.data.channel };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to create channel' };
  }
};
export const getUsers = async (authToken, userId, query = '', limit = 50) => {
  try {
    const selector = query
      ? {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } }
        ]
      }
      : {};
    const response = await api.get(`/users.list?query=${encodeURIComponent(JSON.stringify(selector))}&count=${limit}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      users: response.data.users || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch users',
    };
  }
};
// Get all users
export const getAllUsers = async (authToken, userId, offset = 0, count = 50) => {
  try {
    const response = await api.get(`/users.list?offset=${offset}&count=${count}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      users: response.data.users || [],
      total: response.data.total,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get users',
    };
  }
};

export const updateUser = async (targetUserId, data, authToken, userId) => {
  try {
    const headers = getAuthHeaders(authToken, userId);
    const response = await api.post(
      '/users.update',
      {
        userId: targetUserId,
        data: {
          name: data.name,
          username: data.username,
          email: data.email,
          roles: data.roles,
          active: data.active,
          verified: data.verified,
        },
      },
      { headers }
    );
    return {
      success: true,
      user: response.data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update user',
    };
  }
};

//upload files
export const uploadFileToRoom = async (roomId, file, authToken, userId, description = '', onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);

    // Use XMLHttpRequest for progress tracking (axios doesn't support it natively for uploads)
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${api.defaults.baseURL}/rooms.upload/${roomId}`);

      // Set headers
      xhr.setRequestHeader('X-Auth-Token', authToken);
      xhr.setRequestHeader('X-User-Id', userId);

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          if (data.success) {
            const fileDetails = {
              _id: data.file._id,
              etag: data.file.etag,
              name: file.name,
              size: file.size,
              type: file.type,
            };
            resolve({
              success: true,
              fileDetails,
            });
          } else {
            resolve({
              success: false,
              error: data.error || 'Failed to upload file',
            });
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload network error'));
      xhr.send(formData);
    });
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to upload file',
    };
  }
};

// Get all channels (public channels)
export const getAllChannels = async (authToken, userId, offset = 0, count = 50) => {
  try {
    const response = await api.get(`/channels.list?offset=${offset}&count=${count}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      channels: response.data.channels || [],
      total: response.data.total,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get channels',
    };
  }
};

// Get all private groups
export const getAllGroups = async (authToken, userId, offset = 0, count = 50) => {
  try {
    const response = await api.get(`/groups.listAll?offset=${offset}&count=${count}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      channels: response.data.groups || [],
      total: response.data.total,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get groups',
    };
  }
};

// Rename channel
export const renameChannel = async (roomId, newName, authToken, userId) => {
  try {
    await api.post('/channels.rename', {
      roomId,
      name: newName,
    }, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to rename channel' };
  }
};

// Add users to channel
export const addUsersToChannel = async (roomId, userIdToAdd, authToken, userId) => {
  try {
    await api.post('/channels.invite', {
      roomId,
      userId: userIdToAdd,
    }, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to add user to channel'
    };
  }
};

// Remove user from channel
export const removeUserFromChannel = async (roomId, targetUserId, authToken, userId) => {
  try {
    await api.post('/channels.kick', {
      roomId,
      userId: targetUserId,
    }, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to remove user from channel'
    };
  }
};


export const deleteChannel = async (roomId, authToken, userId) => {
  try {
    await api.post('/channels.delete', {
      roomId,
    }, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete channel'
    };
  }
};

export const deleteGroup = async (roomId, authToken, userId) => {
  try {
    await api.post('/groups.delete', {
      roomId,
    }, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete group'
    };
  }
};

export const getChannelMembers = async (roomId, authToken, userId, offset = 0, count = 50) => {
  try {
    const response = await api.get(`/channels.members?roomId=${roomId}&offset=${offset}&count=${count}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      members: response.data.members || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get channel members',
    };
  }
};
// Update channel description
export const updateChannelDescription = async (roomId, description, authToken, userId) => {
  try {
    await api.post('/channels.setDescription', {
      roomId,
      description,
    }, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to update description' };
  }
};

// Update channel topic
export const updateChannelTopic = async (roomId, topic, authToken, userId) => {
  try {
    await api.post('/channels.setTopic', {
      roomId,
      topic,
    }, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to update topic' };
  }
};

// Update user profile
export const updateUserProfile = async (targetUserId, data, authToken, userId) => {
  try {
    const headers = getAuthHeaders(authToken, userId);
    const response = await api.post(
      '/users.update',
      {
        userId: targetUserId,
        data: {
          name: data.name,
          username: data.username,
          email: data.email,
          bio: data.bio,
        },
      },
      { headers }
    );
    return {
      success: true,
      user: response.data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update profile',
    };
  }
};

// Upload avatar
export const uploadAvatar = async (file, authToken, userId) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('userId', userId);

    await api.post('/users.setAvatar', formData, {
      headers: {
        'X-Auth-Token': authToken,
        'X-User-Id': userId,
        'Content-Type': 'multipart/form-data',
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to upload avatar',
    };
  }
};

// Get user avatar
export const getUserAvatar = async (username, authToken, userId) => {
  try {
    const response = await api.get(`/users.getAvatar?username=${username}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      avatarUrl: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get avatar',
    };
  }
};

export const addReaction = async (messageId, emoji, authToken, userId, shouldReact = true) => {
  try {
    console.log('Sending reaction request:', { messageId, emoji, shouldReact });
    const response = await api.post(
      '/chat.react',
      { messageId, emoji, shouldReact },
      {
        headers: getAuthHeaders(authToken, userId),
      }
    );
    console.log('Reaction response:', response.data);
    return {
      success: true,
      updatedReactions: response.data.message?.reactions || {},
    };
  } catch (error) {
    console.error('Reaction error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to add reaction',
    };
  }
};

export const searchMessages = async (roomId, searchText, authToken, userId, count = 20) => {
  try {
    const response = await api.get(`/chat.search?roomId=${roomId}&searchText=${encodeURIComponent(searchText)}&count=${count}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: response.data.success,
      messages: response.data.messages || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to search messages',
    };
  }
};
export const searchMessagesGlobal = async (searchQuery, authToken, userId, limit = 5) => {
  try {
    const response = await api.get(`/chat.search?query=${encodeURIComponent(searchQuery)}&count=${limit}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    
    return { 
      success: true, 
      messages: response.data.messages || [] 
    };
  } catch (error) {
    console.error('Global messages search error:', error.response?.data);
    
    try {
      const roomsResult = await getRooms(authToken, userId);
      if (!roomsResult.success) return { success: false, messages: [] };

      const rooms = roomsResult.rooms.filter(room => room.t === 'c' || room.t === 'p').slice(0, 3);
      
      const messagePromises = rooms.map(async (room) => {
        try {
          const endpoint = room.t === 'c' ? '/channels.history' : '/groups.history';
          const response = await api.get(`${endpoint}?roomId=${room._id}&count=50`, {
            headers: getAuthHeaders(authToken, userId),
          });
          return response.data.messages || [];
        } catch{ 
          return [];
        }
      });

      const allMessages = (await Promise.all(messagePromises)).flat();
      const filteredMessages = allMessages.filter(msg => 
        msg.msg && msg.msg.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return { 
        success: true, 
        messages: filteredMessages.slice(0, limit) 
      };
    } catch (fallbackError) {
      console.error('Fallback search failed:', fallbackError);
      return { success: false, messages: [], error: 'Search service unavailable' };
    }
  }
};

export const searchUsers = async (searchQuery, authToken, userId, limit = 5) => {
  try {
    const response = await api.get(`/users.list?query=${encodeURIComponent(searchQuery)}&count=${limit}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    
    const filteredUsers = (response.data.users || []).filter(user => 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return { 
      success: true, 
      users: filteredUsers.slice(0, limit) 
    };
  } catch (error) {
    console.error('Users search error:', error);
    
    try {
      const response = await api.get(`/users.list?count=100`, {
        headers: getAuthHeaders(authToken, userId),
      });
      
      const filteredUsers = (response.data.users || []).filter(user => 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      return { 
        success: true, 
        users: filteredUsers.slice(0, limit) 
      };
    } catch (fallbackError) {
      console.error('Fallback user search failed:', fallbackError);
      return { success: false, users: [] };
    }
  }
};

export const searchChannels = async (searchQuery, authToken, userId, limit = 5) => {
  try {
    const response = await api.get(`/channels.list?query=${encodeURIComponent(searchQuery)}&count=${limit}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    
    const filteredChannels = (response.data.channels || []).filter(channel => 
      channel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.topic?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return { 
      success: true, 
      channels: filteredChannels.slice(0, limit) 
    };
  } catch (error) {
    console.error('Channels search error:', error);
    
    try {
      const response = await api.get(`/channels.list?count=100`, {
        headers: getAuthHeaders(authToken, userId),
      });
      
      const filteredChannels = (response.data.channels || []).filter(channel => 
        channel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      return { 
        success: true, 
        channels: filteredChannels.slice(0, limit) 
      };
    } catch (fallbackError) {
      console.error('Fallback channel search failed:', fallbackError);
      return { success: false, channels: [] };
    }
  }
};

export const searchFiles = async (searchQuery, authToken, userId, limit = 5) => {
  try {
    const roomsResult = await getRooms(authToken, userId);
    if (!roomsResult.success) return { success: false, files: [] };

    const rooms = roomsResult.rooms.slice(0, 5);
    
    const filePromises = rooms.map(async (room) => {
      try {
        let endpoint;
        if (room.t === 'c') {
          endpoint = '/channels.files';
        } else if (room.t === 'p') {
          endpoint = '/groups.files';
        } else if (room.t === 'd') {
          endpoint = '/im.files';
        } else {
          return [];
        }
        
        const response = await api.get(`${endpoint}?roomId=${room._id}&count=50`, {
          headers: getAuthHeaders(authToken, userId),
        });
        return response.data.files || [];
      } catch {
        return [];
      }
    });

    const allFiles = (await Promise.all(filePromises)).flat();
    const filteredFiles = allFiles.filter(file => 
      file.name && file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return { 
      success: true, 
      files: filteredFiles.slice(0, limit) 
    };
  } catch (error) {
    console.error('Files search error:', error);
    return { success: false, files: [] };
  }
};

export const searchAll = async (searchQuery, authToken, userId, limit = 5) => {
  try {
    const [messagesResult, usersResult, channelsResult, filesResult] = await Promise.allSettled([
      searchMessagesGlobal(searchQuery, authToken, userId, limit),
      searchUsers(searchQuery, authToken, userId, limit),
      searchChannels(searchQuery, authToken, userId, limit),
      searchFiles(searchQuery, authToken, userId, limit)
    ]);

    return {
      success: true,
      messages: messagesResult.status === 'fulfilled' ? messagesResult.value.messages || [] : [],
      users: usersResult.status === 'fulfilled' ? usersResult.value.users || [] : [],
      channels: channelsResult.status === 'fulfilled' ? channelsResult.value.channels || [] : [],
      files: filesResult.status === 'fulfilled' ? filesResult.value.files || [] : []
    };
  } catch (error) {
    console.error('Comprehensive search error:', error);
    return {
      success: false,
      messages: [],
      users: [],
      channels: [],
      files: []
    };
  }
};

export const deleteUser = async (targetUserId, authToken, userId) => {
  try {
    const response = await api.post(
      '/users.delete',
      { userId: targetUserId },
      {
        headers: getAuthHeaders(authToken, userId),
      }
    );
    return {
      success: true,
      message: response.data.success ? 'User deleted successfully' : 'Failed to delete user',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete user',
    };
  }
};

export const connectStream = (roomId, authToken, userId, onEvent) => {
  const url = `${BASE_URL}/api/v1/streams.messages/${roomId}`;

  const es = new EventSource(url, {
    withCredentials: true,
    headers: {
      'X-Auth-Token': authToken,
      'X-User-Id': userId,
    },
  });

  es.onopen = () => {
    console.log(`Stream connected for room ${roomId}`);
    onEvent({ type: 'stream_open' });
  };

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.fields?.args && data.fields.args.length > 0) {
        const msg = data.fields.args[0];
        onEvent({ type: data.msg, message: msg });
      }
    } catch (err) {
      console.error('Stream parse error:', err);
    }
  };

  es.onerror = (err) => {
    console.error('Stream error:', err);
    onEvent({ type: 'stream_error' });
    es.close();
  };

  return () => {
    es.close();
    console.log(`Stream closed for room ${roomId}`);
  };
};

// Logout
export const logout = async (authToken, userId) => {
  try {
    await api.post('/logout', {}, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Logout failed',
    };
  }
};