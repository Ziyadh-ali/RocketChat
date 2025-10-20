import React, { useEffect, useRef } from 'react';
import Message from './Message';

const MessageList = ({ messages, currentUserId, onDeleteMessage, pinMessage, onUpdateMessage, onUpdateReaction }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 p-4">
        <div className="flex justify-center items-center h-full text-gray-400 text-center">
          <div className="text-sm">No messages yet. Start the conversation!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 p-4 flex flex-col space-y-4">
      {messages.map((message, index) => (
        <Message
          key={message._id || index}
          message={message}
          isOwn={message.u?._id === currentUserId}
          onDelete={onDeleteMessage}
          pinMessage={pinMessage}
          onUpdate={onUpdateMessage}
          roomId={message.rid}
          onUpdateReaction={onUpdateReaction}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;