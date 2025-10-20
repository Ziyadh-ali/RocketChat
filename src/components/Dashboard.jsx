import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import CreateUserModal from './CreateUserModal';
import CreateChannelModal from './CreateChannelModal';
import UserListModal from './UserListModal'; // New import
import ChannelListModal from './ChannelListModal'; // New import

const Dashboard = () => {
    const navigate = useNavigate();
    const { authToken, userId, user } = useAuth();
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
    const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
    const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
    const [isChannelListModalOpen, setIsChannelListModalOpen] = useState(false);

    const handleCardClick = (action) => {
        switch (action) {
            case 'addUser':
                setIsCreateUserModalOpen(true);
                break;
            case 'addChannel':
                setIsCreateChannelModalOpen(true);
                break;
            case 'manageUsers':
                setIsUserListModalOpen(true);
                break;
            case 'manageChannels':
                setIsChannelListModalOpen(true);
                break;
            case 'viewStats':
                console.log('View Stats clicked');
                break;
            default:
                break;
        }
    };

    const handleChannelCreated = () => {
        setIsCreateChannelModalOpen(false);
    };

    const dashboardCards = [
        {
            id: 'addUser',
            title: 'Add User',
            description: 'Invite new users to the workspace',
            icon: '👥',
            color: 'from-blue-500 to-blue-600',
        },
        {
            id: 'addChannel',
            title: 'Add Channel',
            description: 'Create new channels for team communication',
            icon: '📢',
            color: 'from-green-500 to-green-600',
        },
        {
            id: 'manageChannels',
            title: 'Manage Channels',
            description: 'View and edit channels',
            icon: '📁',
            color: 'from-orange-500 to-orange-600',
        },
    ];

    // Add Manage Users card only for admins
    if (user?.roles?.includes('admin')) {
        dashboardCards.push({
            id: 'manageUsers',
            title: 'Manage Users',
            description: 'View and edit users in the workspace',
            icon: '🛡️',
            color: 'from-purple-500 to-purple-600',
        });
    }

    // ✅ Show "Add User" card only if admin
    const filteredCards = user?.roles?.includes('admin')
        ? dashboardCards
        : dashboardCards.filter((card) => card.id !== 'addUser');

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            <Header />

            <div className="flex-1 bg-gray-900 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                        <p className="text-gray-400">Welcome to your workspace dashboard</p>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCards.map((card) => (
                            <div
                                key={card.id}
                                onClick={() => handleCardClick(card.id)}
                                className="bg-gray-800 p-6 rounded-2xl shadow-md hover:bg-gray-750 transition-all duration-200 cursor-pointer group"
                            >
                                <div className="flex items-center mb-4">
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${card.color} flex items-center justify-center text-2xl mr-4`}
                                    >
                                        {card.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white group-hover:text-rose-400 transition-colors">
                                        {card.title}
                                    </h3>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">{card.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 bg-gray-800 p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-semibold text-white mb-4">Quick Actions</h2>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => navigate('/dashboard/chat')}
                                className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg shadow-md px-6 py-3 transition-colors duration-200"
                            >
                                Open Chat
                            </button>
                            <button
                                onClick={() => handleCardClick('addChannel')}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md px-6 py-3 transition-colors duration-200"
                            >
                                Create Channel
                            </button>
                            {user.roles.includes('admin') && (
                                <button
                                    onClick={() => setIsCreateUserModalOpen(true)}
                                    className="bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md px-6 py-3 transition-colors duration-200"
                                >
                                    Create Users
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CreateUserModal
                isOpen={isCreateUserModalOpen}
                onClose={() => setIsCreateUserModalOpen(false)}
                authToken={authToken}
                userId={userId}
            />
            <CreateChannelModal
                isOpen={isCreateChannelModalOpen}
                onClose={() => setIsCreateChannelModalOpen(false)}
                authToken={authToken}
                userId={userId}
                onChannelCreated={handleChannelCreated}
            />
            <UserListModal
                isOpen={isUserListModalOpen}
                onClose={() => setIsUserListModalOpen(false)}
                authToken={authToken}
                userId={userId}
            />
            <ChannelListModal
                isOpen={isChannelListModalOpen}
                onClose={() => setIsChannelListModalOpen(false)}
                authToken={authToken}
                userId={userId}
            />
        </div>
    );
};

export default Dashboard;