import React, { useState, useEffect } from 'react';
import { X, Search, MessageCircle, Users, Hash, FileText, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createDirectMessage, searchAll } from '../services/rocketchat';

const SearchModal = ({ isOpen, onClose }) => {
    const { authToken, userId } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('messages');
    const [results, setResults] = useState({ messages: [], users: [], channels: [], files: [] });
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) setRecentSearches(JSON.parse(saved));
    }, []);

    useEffect(() => {
        if (isOpen && query.length >= 2) {
            performSearch(query);
        } else {
            setResults({ messages: [], users: [], channels: [], files: [] });
        }
    }, [query, isOpen , authToken, userId]);

    const performSearch = async (searchQuery) => {
        setLoading(true);
        try {
            const searchResults = await searchAll(searchQuery, authToken, userId);

            setResults({
                messages: searchResults.messages || [],
                users: searchResults.users || [],
                channels: searchResults.channels || [],
                files: searchResults.files || []
            });
        } catch (err) {
            console.error('Search error:', err);
            setResults({
                messages: [],
                users: [],
                channels: [],
                files: []
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = async (type, item) => {
        onClose();
        const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('recentSearches', JSON.stringify(newRecent));

        let targetState = {};

        if (type === 'message') {
            targetState = { targetRoomId: item.rid, targetMessageId: item._id };
        } else if (type === 'channel') {
            targetState = { targetRoomId: item._id };
        } else if (type === 'user') {
            try {
                const result = await createDirectMessage(item.username, authToken, userId);
                if (result.success) {
                    targetState = { targetRoomId: result.room._id };
                } else {
                    console.error('Failed to create DM:', result.error);
                    return;
                }
            } catch (error) {
                console.error('DM creation error:', error);
                return;
            }
        } else if (type === 'file') {
            if (item.url) {
                window.open(item.url, '_blank');
            }
            return;
        }

        // Navigate with state
        navigate('/dashboard/chat', { state: targetState });
    };
    const tabs = [
        { key: 'messages', label: 'Messages', icon: MessageCircle },
        { key: 'users', label: 'Users', icon: Users },
        { key: 'channels', label: 'Channels', icon: Hash },
        { key: 'files', label: 'Files', icon: FileText }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <Search size={20} className="text-rose-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search messages, users, channels, files..."
                            className="bg-transparent outline-none text-white text-lg w-96"
                            autoFocus
                        />
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-gray-700">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-rose-500/20 text-rose-400 border-b-2 border-rose-500' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <tab.icon size={16} className="inline mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {query === '' && recentSearches.length > 0 && (
                    <div className="p-6 border-b border-gray-700">
                        <h4 className="text-gray-300 mb-3">Recent Searches</h4>
                        <div className="flex flex-wrap gap-2">
                            {recentSearches.map((search, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setQuery(search)}
                                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-gray-600"
                                >
                                    {search} <Clock size={12} className="inline ml-1" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="w-8 h-8 border-4 border-gray-700 border-t-rose-500 rounded-full animate-spin" />
                        </div>
                    ) : results[activeTab].length > 0 ? (
                        results[activeTab].map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleResultClick(activeTab, item)}
                                className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                            >
                                <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white">
                                    {activeTab === 'messages' && <MessageCircle size={16} />}
                                    {activeTab === 'users' && <Users size={16} />}
                                    {activeTab === 'channels' && <Hash size={16} />}
                                    {activeTab === 'files' && <FileText size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {activeTab === 'messages' && (
                                        <>
                                            <p className="text-white font-medium truncate">{item.msg}</p>
                                            <p className="text-gray-400 text-sm truncate">
                                                @{item.u?.username || 'Unknown'} in #{item.roomName || item.rid} • {new Date(item.ts).toLocaleString()}
                                            </p>
                                        </>
                                    )}
                                    {activeTab === 'users' && (
                                        <>
                                            <p className="text-white font-medium truncate">{item.name || item.username}</p>
                                            <p className="text-gray-400 text-sm">@{item.username}</p>
                                        </>
                                    )}
                                    {activeTab === 'channels' && (
                                        <>
                                            <p className="text-white font-medium">#{item.name}</p>
                                            <p className="text-gray-400 text-sm">{item.description || 'Channel'}</p>
                                        </>
                                    )}
                                    {activeTab === 'files' && (
                                        <>
                                            <p className="text-white font-medium truncate">{item.name}</p>
                                            <p className="text-gray-400 text-sm">{item.type} - {item.size} bytes</p>
                                        </>
                                    )}
                                </div>
                                <ArrowRight size={16} className="text-gray-400" />
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 text-center py-8">No results for "{query}" in {activeTab}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;