import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, ShieldCheck } from 'lucide-react';
import { ChatMessage } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';

export default function OnlineChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize unique session
  useEffect(() => {
    let savedSessionId = localStorage.getItem('imbloco-chat-session-id');
    let savedVisitorName = localStorage.getItem('imbloco-chat-visitor-name');

    if (!savedSessionId) {
      savedSessionId = 'session_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('imbloco-chat-session-id', savedSessionId);
    }
    setSessionId(savedSessionId);

    if (savedVisitorName) {
      setVisitorName(savedVisitorName);
      setIsNameSet(true);
    }
  }, []);

  // Fetch messages periodically when open
  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          // If there are new messages and the chat is closed, trigger unread indicator
          if (data.length > messages.length && !isOpen && messages.length > 0) {
            setHasUnread(true);
          }
          setMessages(data);
        }
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [sessionId, messages.length, isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSetVisitorName = (e: React.FormEvent) => {
    e.preventDefault();
    if (visitorName.trim()) {
      localStorage.setItem('imbloco-chat-visitor-name', visitorName.trim());
      setIsNameSet(true);
      
      // Send initial greeting trigger
      handleSendMessage("Olá! Gostaria de tirar algumas dúvidas sobre os imóveis.");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || newMessage;
    if (!text.trim() || !sessionId) return;

    const sender = visitorName || 'Cliente';

    // Optimistic local update
    const tempMsg: ChatMessage = {
      id: Date.now(),
      sessionId,
      senderName: sender,
      message: text,
      isAdmin: false,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    if (!textToSend) setNewMessage('');

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          senderName: sender,
          message: text,
          isAdmin: false
        })
      });
    } catch (err) {
      console.error('Error sending message to backend:', err);
    }
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnread(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      <motion.button
        onClick={handleToggleChat}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white p-4.5 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-colors"
      >
        <MessageSquare className="w-6 h-6" />
        
        {/* Unread dot */}
        {hasUnread && (
          <span className="absolute top-0 right-0 block h-3.5 w-3.5 rounded-full bg-black border-2 border-white animate-pulse" />
        )}
      </motion.button>

      {/* Chat Window Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="bg-black text-white px-5 py-4 rounded-t-2xl flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse" />
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">Atendimento Online</h4>
                  <p className="text-[10px] text-orange-400 font-mono">Imbloco Construtora</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col justify-between">
              {!isNameSet ? (
                /* Prompt for name */
                <form onSubmit={handleSetVisitorName} className="flex-1 flex flex-col justify-center space-y-4 p-4">
                  <div className="text-center space-y-1">
                    <User className="w-10 h-10 text-orange-500 mx-auto bg-orange-50 p-2 rounded-full" />
                    <h5 className="text-xs font-bold text-black uppercase tracking-wider">Identifique-se</h5>
                    <p className="text-xs text-gray-500 font-light leading-relaxed">
                      Olá! Digite seu nome para iniciar o atendimento online com nossos corretores.
                    </p>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-black focus:outline-hidden focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-lg text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Iniciar Chat
                  </button>
                </form>
              ) : (
                /* Message history */
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-gray-400 font-light">Nenhuma mensagem enviada.</p>
                      <p className="text-[10px] text-gray-400 font-light">Envie sua dúvida para começar!</p>
                    </div>
                  )}

                  {messages.map((msg, index) => {
                    const isMe = !msg.isAdmin;
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {/* Sender Label */}
                        <span className="text-[9px] text-gray-400 font-medium mb-1 px-1 flex items-center gap-1">
                          {!isMe && <ShieldCheck className="w-3 h-3 text-orange-500" />}
                          {msg.senderName}
                        </span>

                        {/* Speech Bubble */}
                        <div
                          className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-orange-600 text-white rounded-tr-none'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-xs'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Footer Area */}
            {isNameSet && (
              <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Digite sua dúvida..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black focus:outline-hidden focus:border-orange-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="bg-black hover:bg-orange-600 text-white p-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
