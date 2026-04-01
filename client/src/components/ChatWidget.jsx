import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader, CheckCircle2 } from 'lucide-react';
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
  const [convStatus, setConvStatus] = useState('pending'); // pending | active | closed
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
  }, [messages, typingIndicator, scrollToBottom]);

  useEffect(() => {
    if (!auth.authenticate || !open) return;

    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) return;

    setLoading(true);
    setConnectionError(false);

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
          setConvStatus(data.status || 'pending');
          setMessages(data.messages || []);
          socket.emit('chat:join-conversation', { conversationId: data.conversationId });
        }
      } catch {
        // Non-critical — conversation will be created on first send
      } finally {
        setLoading(false);
      }
    });

    socket.on('connect_error', () => {
      setConnectionError(true);
      setConnected(false);
      setLoading(false);
    });

    socket.on('chat:message', (msg) => {
      setMessages((prev) => {
        // Deduplicate by _id and by optimistic tempId
        const exists = prev.some(
          (m) => (m._id && m._id === msg._id) || (m.tempId && m.tempId === msg.tempId),
        );
        if (exists) {
          // Replace optimistic message with server-confirmed message
          return prev.map((m) =>
            (m.tempId && m.tempId === msg.tempId) || (m._id && m._id === msg._id) ? msg : m,
          );
        }
        return [...prev, msg];
      });
      setTypingIndicator(false);
    });

    socket.on('chat:typing', ({ isTyping }) => {
      setTypingIndicator(isTyping);
    });

    socket.on('chat:admin-joined', () => {
      setConvStatus('active');
    });

    socket.on('chat:closed', () => {
      setConvStatus('closed');
    });

    socket.on('chat:error', ({ message }) => {
      // Remove failed optimistic messages
      setMessages((prev) => prev.filter((m) => !m.isOptimistic));
      // Could show a toast here if needed
      console.error('Chat error:', message);
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
    if (!input.trim() || !conversationId || !socketRef.current || convStatus === 'closed') return;

    const trimmed = input.trim();
    const tempId = `temp-${Date.now()}`;
    const currentUserId = auth.user?._id || auth.user?.id;

    // Optimistic update — show message immediately
    const optimisticMsg = {
      tempId,
      _id: null,
      isOptimistic: true,
      conversationId,
      sender: { userId: { _id: currentUserId }, role: 'customer' },
      message: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');

    socketRef.current.emit('chat:send', { conversationId, message: trimmed, tempId });

    clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('chat:typing', { conversationId, isTyping: false });
  }, [input, conversationId, convStatus, auth.user]);

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

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const currentUserId = auth.user?._id || auth.user?.id;

  if (!auth.authenticate) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-80 h-[460px] bg-card border border-border rounded-xl shadow-card flex flex-col overflow-hidden">
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

          {/* Status banner */}
          {convStatus === 'active' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-100 text-green-700 text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Support agent has joined
            </div>
          )}
          {convStatus === 'closed' && (
            <div className="px-4 py-2 bg-muted border-b border-border text-muted-foreground text-xs text-center font-medium">
              This conversation has been closed
            </div>
          )}
          {convStatus === 'pending' && messages.length > 0 && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-amber-700 text-xs text-center">
              Waiting for a support agent to join…
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : connectionError ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <p className="text-sm text-muted-foreground">Unable to connect to chat.</p>
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs text-primary hover:underline"
                >
                  Close and try again
                </button>
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
                    key={msg._id || msg.tempId || i}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        isOwn
                          ? `bg-primary text-primary-foreground ${msg.isOptimistic ? 'opacity-70' : ''}`
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-[11px] font-semibold mb-1 opacity-70">Support</p>
                      )}
                      <p>{msg.message}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {msg.createdAt ? formatTime(msg.createdAt) : ''}
                        {msg.isOptimistic && ' · Sending…'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {typingIndicator && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-1">
                  <span className="inline-flex gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {convStatus === 'closed' ? (
            <div className="p-3 border-t border-border text-center text-sm text-muted-foreground">
              Chat ended. Thank you for contacting us!
            </div>
          ) : connectionError ? null : (
            <div className="p-3 border-t border-border flex gap-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                disabled={!conversationId}
                className="flex-1 text-sm px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
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
