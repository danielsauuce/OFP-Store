import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Loader } from 'lucide-react';
import { io } from 'socket.io-client';
import { getConversationsService, getMessagesService } from '../../services/chatService';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Connect to /chat namespace
  useEffect(() => {
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) return;

    const socket = io(`${BACKEND_URL}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('chat:message', (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });
      // Update conversation list unread badge
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversationId && msg.sender?.role === 'customer'
            ? {
                ...c,
                unreadCount: (c.unreadCount || 0) + 1,
                lastMessage: { ...c.lastMessage, message: msg.message },
              }
            : c,
        ),
      );
    });

    socket.on('chat:typing', ({ userId, isTyping }) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Load conversations
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getConversationsService();
        if (data?.success) setConversations(data.conversations);
      } catch {
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSelectConversation = async (conv) => {
    setSelectedConv(conv);
    setMessagesLoading(true);

    // Mark as read locally
    setConversations((prev) =>
      prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c)),
    );

    try {
      const data = await getMessagesService(conv._id);
      if (data?.success) setMessages(data.messages);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }

    if (socketRef.current) {
      socketRef.current.emit('chat:join-conversation', { conversationId: conv._id });
    }
  };

  const handleSend = useCallback(() => {
    if (!input.trim() || !selectedConv || !socketRef.current) return;

    socketRef.current.emit('chat:send', {
      conversationId: selectedConv._id,
      message: input.trim(),
    });

    setInput('');
  }, [input, selectedConv]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const anyTyping = Object.values(typingUsers).some(Boolean);

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-6">
      {/* Conversation list */}
      <div className="w-72 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Conversations
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground p-6">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors ${
                  selectedConv?._id === conv._id ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">
                    {conv._id.replace('conv:', 'User ')}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                {conv.lastMessage?.message && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.lastMessage.message}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message panel */}
      <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Select a conversation to start replying</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground">
                {selectedConv._id.replace('conv:', 'Customer ')}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isAdmin = msg.sender?.role === 'admin';
                  return (
                    <div
                      key={msg._id || i}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                          isAdmin
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {!isAdmin && (
                          <p className="text-[11px] font-medium mb-1 text-muted-foreground">
                            {msg.sender?.userId?.fullName || 'Customer'}
                          </p>
                        )}
                        <p>{msg.message}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {anyTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                    Customer is typing…
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to customer…"
                className="flex-1 text-sm px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
