
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  theme?: 'light' | 'dark';
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, theme = 'dark' }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm transition-all duration-300 ${
          isUser 
          ? 'bg-blue-600 border border-blue-500/30 text-white rounded-tr-none' 
          : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-gray-100 rounded-tl-none glass-card'
        }`}
      >
        <div className={`text-sm font-medium mb-1 flex items-center gap-2 ${isUser ? 'opacity-80' : 'opacity-50'}`}>
          {isUser ? 'You' : 'Sahayak'}
          <span className="text-[10px] font-normal">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        {message.image && (
          <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 shadow-lg">
            <img 
              src={message.image} 
              alt="Shared content" 
              className="w-full h-auto max-h-96 object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
