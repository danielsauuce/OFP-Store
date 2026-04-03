import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader, CheckCircle2, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/authContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Generate or retrieve a persistent guest session ID
function getGuestId() {
  const key = 'ofp-guest-chat-id';
  let id = localStorage.getItem(key);
  if (!id) {
    // UUID v4 via crypto — no external dependency
    id = crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(key, id);
  }
  return id;
}

function ChatWidget() {
  const { auth } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [convStatus, setConvStatus] = useState('pending');
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const guestId = useRef(getGuestId());

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingIndicator, scrollToBottom]);

  useEffect(() => {
    if (!open) return;

    const accessToken = auth.authenticate ? sessionStorage.getItem('accessToken') : null;

    setLoading(true);
    setConnectionError(false);

    const authPayload = accessToken
      ? { token: accessToken }
      : { guestId: guestId.current };

    const socket = io(`${BACKEND_URL}/chat`, {
      auth: authPayload,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setConnectionError(false);
      // Initialize conversation via socket event
      socket.emit('chat:init');
    });

    socket.on('chat:initialized', ({ conversationId: convId, status, messages: msgs }) => {
      setConversationId(convId);
      setConvStatus(status || 'pending');
      setMessages(msgs || []);
      setLoading(false);
    });

    socket.on('connect_error', () => {
      setConnectionError(true);
      setConnected(false);
      setLoading(false);
    });

    socket.on('chat:message', (msg) => {
      setMessages((prev) => {
        const exists = prev.some(
          (m) => (m._id && m._id === msg._id) || (m.tempId && m.tempId === msg.tempId),
        );
        if (exists) {
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
      setMessages((prev) => prev.filter((m) => !m.isOptimistic));
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

  const handleStartNewChat = useCallback(() => {
    if (!socketRef.current || !connected) return;
    setMessages([]);
    setConvStatus('pending');
    setConversationId(null);
    socketRef.current.emit('chat:init', { forceNew: true });
    setLoading(true);
  }, [connected]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !conversationId || !socketRef.current || convStatus === 'closed') return;

    const trimmed = input.trim();
    const tempId = `temp-${Date.now()}`;
    const currentUserId = auth.user?._id || auth.user?.id;

    const optimisticMsg = {
      tempId,
      _id: null,
      isOptimistic: true,
      conversationId,
      sender: {
        userId: currentUserId ? { _id: currentUserId } : null,
        role: auth.authenticate ? 'customer' : 'guest',
        senderName: auth.user?.fullName || 'Guest',
      },
      message: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');

    socketRef.current.emit('chat:send', { conversationId, message: trimmed, tempId });

    clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('chat:typing', { conversationId, isTyping: false });
  }, [input, conversationId, convStatus, auth]);

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

  const isOwnMessage = (msg) => {
    if (auth.authenticate) {
      return (
        msg.sender?.userId?._id === currentUserId || msg.sender?.userId === currentUserId
      );
    }
    // Guest: messages with guest role and not admin
    return msg.sender?.role === 'guest' || msg.sender?.role === 'customer';
  };

  const getSenderAvatar = (msg) => {
    if (msg.sender?.userId?.profilePicture) return msg.sender.userId.profilePicture;
    return null;
  };

  const getSenderInitials = (msg) => {
    if (msg.sender?.userId?.fullName) {
      return msg.sender.userId.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return msg.sender?.role === 'admin' ? 'A' : 'G';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-80 h-[500px] bg-card border border-border rounded-xl shadow-card flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <span className="font-semibold text-sm">Support Chat</span>
                {!auth.authenticate && (
                  <span className="block text-[10px] opacity-70">Guest session</span>
                )}
              </div>
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

          {/* Status banners */}
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
                const own = isOwnMessage(msg);
                const avatarUrl = !own ? getSenderAvatar(msg) : null;
                const initials = !own ? getSenderInitials(msg) : null;

                return (
                  <div
                    key={msg._id || msg.tempId || i}
                    className={`flex items-end gap-2 ${own ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Support avatar */}
                    {!own && (
                      <div className="shrink-0 h-6 w-6 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Support" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-primary">{initials}</span>
                        )}
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        own
                          ? `bg-primary text-primary-foreground rounded-br-sm ${msg.isOptimistic ? 'opacity-70' : ''}`
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      {!own && (
                        <p className="text-[10px] font-semibold mb-0.5 opacity-70">Support</p>
                      )}
                      <p>{msg.message}</p>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          own ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {msg.createdAt ? formatTime(msg.createdAt) : ''}
                        {msg.isOptimistic && ' · Sending…'}
                      </p>
                    </div>

                    {/* Own user avatar (authenticated only) */}
                    {own && auth.authenticate && (
                      <div className="shrink-0 h-6 w-6 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                        {auth.user?.profilePicture ? (
                          <img
                            src={auth.user.profilePicture}
                            alt="You"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-primary">
                            {(auth.user?.fullName || 'U')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {typingIndicator && (
              <div className="flex items-end gap-2 justify-start">
                <div className="shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-primary">A</span>
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-muted-foreground flex items-center gap-1">
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

          {/* Input area */}
          {convStatus === 'closed' ? (
            <div className="p-3 border-t border-border space-y-2">
              <p className="text-xs text-center text-muted-foreground">
                Chat ended. Thank you for contacting us!
              </p>
              <button
                onClick={handleStartNewChat}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Start new conversation
              </button>
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
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !conversationId}
                className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary-dark transition-colors"
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
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-dark transition-all hover:scale-105 flex items-center justify-center"
        aria-label={open ? 'Close chat' : 'Open support chat'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}

export default ChatWidget;
