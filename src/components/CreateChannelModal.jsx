import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createChannel, getUsers } from '../services/rocketchat';
import Autocomplete from './AutoComplete';

const CreateChannelModal = ({ isOpen, onClose, authToken, userId, onChannelCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public',
    members: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const result = await getUsers(authToken, userId);
      if (result.success) {
        setAvailableUsers(result.users.map(user => user.username));
      } else {
        setError(result.error);
      }
    };
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, authToken, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Channel name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await createChannel(
        formData.name,
        authToken,
        userId,
        formData.description,
        formData.type,
        formData.members
      );
      if (result.success) {
        alert('Channel created successfully!');
        onChannelCreated();
        onClose();
        setFormData({
          name: '',
          description: '',
          type: 'public',
          members: [],
        });
      } else {
        console.log(result.error)
        setError(result.error || 'Failed to create channel');
      }
    } catch (err) {
    console.log(err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create New Channel</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-sm border border-red-900/30">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Channel Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter channel name"
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter channel description"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
              Channel Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Add Members (Optional)
            </label>
            <Autocomplete
              options={availableUsers}
              value={formData.members}
              onChange={(members) => setFormData(prev => ({ ...prev, members }))}
              placeholder="Type username to add..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
              loading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30'
            } text-white`}
          >
            {loading ? 'Creating...' : 'Create Channel'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;