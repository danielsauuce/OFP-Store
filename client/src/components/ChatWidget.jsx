import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/authContext';
import { createConversationService } from '../services/chatService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function ChatWidget() {
  const { auth } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!auth.authenticate || !open) return;

    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) return;

    setLoading(true);

    const socket = io(`${BACKEND_URL}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', async () => {
      setConnected(true);
      setConnectionError(false);
      try {
        const data = await createConversationService();
        if (data?.success) {
          setConversationId(data.conversationId);
          setMessages(data.messages || []);
          socket.emit('chat:join-conversation', { conversationId: data.conversationId });
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    });

    socket.on('connect_error', () => {
      setConnectionError(true);
      setLoading(false);
    });

    socket.on('chat:message', (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });
      setTypingIndicator(false);
    });

    socket.on('chat:typing', ({ isTyping }) => {
      setTypingIndicator(isTyping);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setLoading(false);
    };
  }, [auth.authenticate, open]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !conversationId || !socketRef.current) return;

    socketRef.current.emit('chat:send', {
      conversationId,
      message: input.trim(),
    });

    setInput('');
  }, [input, conversationId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (!conversationId || !socketRef.current) return;

    socketRef.current.emit('chat:typing', { conversationId, isTyping: true });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('chat:typing', { conversationId, isTyping: false });
    }, 1500);
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentUserId = auth.user?._id || auth.user?.id;

  if (!auth.authenticate) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-80 h-[420px] bg-card border border-border rounded-xl shadow-card flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">Support Chat</span>
              {connected && (
                <span className="h-2 w-2 rounded-full bg-green-400" title="Connected" />
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="hover:opacity-75 transition-opacity"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground mt-8">
                Hi! How can we help you today?
              </p>
            ) : (
              messages.map((msg, i) => {
                const isOwn =
                  msg.sender?.userId?._id === currentUserId || msg.sender?.userId === currentUserId;
                return (
                  <div
                    key={msg._id || i}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}
                    >
                      <p>{msg.message}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {msg.createdAt ? formatTime(msg.createdAt) : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {typingIndicator && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                  Support is typing…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {connectionError ? (
            <div className="p-3 border-t border-border text-center text-sm text-destructive">
              Connection failed. Please close and reopen chat.
            </div>
          ) : (
            <div className="p-3 border-t border-border flex gap-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                className="flex-1 text-sm px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !conversationId}
                className="p-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary-dark transition-colors"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
        aria-label={open ? 'Close chat' : 'Open support chat'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}

export default ChatWidget;
