// src/components/CreateUserModal.jsx (updated with custom Tailwind Autocomplete)
import React, { useState} from 'react';
import { X } from 'lucide-react';
import { createUser } from '../services/rocketchat';
import Autocomplete from './AutoComplete';

const CreateUserModal = ({ isOpen, onClose, authToken, userId }) => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        verified: false,
        joinDefaultChannels: true,
        roles: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password || !formData.email) {
            setError('Username, email, and password are required');
            return;
        }
        let roles = [...formData.roles];
        if (!roles.includes('user')) {
            roles.push('user');
        }

        const submitData = { ...formData, roles };

        setLoading(true);
        setError('');

        try {
            const result = await createUser(submitData, authToken, userId);
            if (result.success) {
                alert('User created successfully!');
                onClose();
                setFormData({
                    name: '',
                    username: '',
                    email: '',
                    password: '',
                    verified: false,
                    joinDefaultChannels: true,
                    roles: [],
                });
            } else {
                setError(result.error || 'Failed to create user');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const availableRoles = ['admin', 'owner', 'moderator'];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Create New User</h2>
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
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                            required
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email"
                            required
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            required
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 text-sm text-gray-300">
                            <input
                                type="checkbox"
                                name="verified"
                                checked={formData.verified}
                                onChange={handleChange}
                                className="rounded border-gray-600 text-rose-500 focus:ring-rose-500"
                            />
                            <span>Verify email</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-300">
                            <input
                                type="checkbox"
                                name="joinDefaultChannels"
                                checked={formData.joinDefaultChannels}
                                onChange={handleChange}
                                className="rounded border-gray-600 text-rose-500 focus:ring-rose-500"
                            />
                            <span>Join default channels</span>
                        </label>
                    </div>

                    {/* Custom Autocomplete for Roles */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Roles (type to search and select; "user" is assigned by default)
                        </label>
                        <Autocomplete
                            options={availableRoles}
                            value={formData.roles}
                            onChange={(roles) => setFormData(prev => ({ ...prev, roles }))}
                            placeholder="Type role name..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Selected: {formData.roles.join(', ') || 'None'}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30'
                            } text-white`}
                    >
                        {loading ? 'Creating...' : 'Create User'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;