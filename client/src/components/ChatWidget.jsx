import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader, CheckCircle2, RefreshCw, Headphones } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/authContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function getGuestId() {
  const key = 'ofp-guest-chat-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(key, id);
  }
  return id;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const guestId = useRef(getGuestId());
  const openRef = useRef(false);
  openRef.current = open;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingIndicator, scrollToBottom]);

  // Clear unread when opening
  useEffect(() => {
    if (open) setUnreadCount(0);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open && connected && !loading) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, connected, loading]);

  useEffect(() => {
    if (!open) return;

    const accessToken = auth.authenticate ? sessionStorage.getItem('accessToken') : null;
    setLoading(true);
    setConnectionError(false);

    const socket = io(`${BACKEND_URL}/chat`, {
      auth: accessToken ? { token: accessToken } : { guestId: guestId.current },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setConnectionError(false);
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
      // Increment unread badge if widget is closed (use ref to avoid stale closure)
      if (!openRef.current) {
        setUnreadCount((n) => n + 1);
      }
    });

    socket.on('chat:typing', ({ isTyping }) => {
      setTypingIndicator(isTyping);
    });

    socket.on('chat:admin-joined', () => setConvStatus('active'));
    socket.on('chat:closed', () => setConvStatus('closed'));

    socket.on('chat:error', () => {
      setMessages((prev) => prev.filter((m) => !m.isOptimistic));
    });

    socket.on('disconnect', () => setConnected(false));

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
    setLoading(true);
    socketRef.current.emit('chat:init', { forceNew: true });
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
        senderName: auth.user?.fullName || 'You',
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

  const currentUserId = auth.user?._id || auth.user?.id;

  const isOwnMessage = (msg) => {
    if (auth.authenticate) {
      return msg.sender?.userId?._id === currentUserId || msg.sender?.userId === currentUserId;
    }
    return msg.sender?.role === 'guest' || msg.sender?.role === 'customer';
  };

  const userInitials = auth.user?.fullName
    ? auth.user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ME';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-[360px] h-[540px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Headphones className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">OFP Support</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {connected ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      <span className="text-white/70 text-[11px]">Online</span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      <span className="text-white/60 text-[11px]">Connecting…</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Status banners */}
          {convStatus === 'active' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-xs font-medium shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Support agent has joined — we&apos;re here to help!
            </div>
          )}
          {convStatus === 'pending' && messages.length > 0 && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-[11px] text-center shrink-0">
              Waiting for an agent to join…
            </div>
          )}
          {convStatus === 'closed' && (
            <div className="px-4 py-2 bg-muted border-b border-border text-muted-foreground text-[11px] text-center font-medium shrink-0">
              This conversation has been closed
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/10">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : connectionError ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Connection failed</p>
                  <p className="text-xs text-muted-foreground mt-1">Please close and try again</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-7 w-7 text-primary/70" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Hi there! 👋</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {auth.authenticate
                      ? `Welcome back, ${auth.user?.fullName?.split(' ')[0] || 'there'}! How can we help you today?`
                      : "How can we help you today? Send us a message and we'll get back to you shortly."}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => {
                const own = isOwnMessage(msg);
                const avatarUrl = !own
                  ? msg.sender?.userId?.profilePicture
                  : auth.user?.profilePicture;
                const isAdmin = msg.sender?.role === 'admin';

                return (
                  <div
                    key={msg._id || msg.tempId || i}
                    className={`flex items-end gap-2 ${own ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Support / other sender avatar */}
                    {!own && (
                      <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Support"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-primary-foreground">
                            {isAdmin ? 'A' : 'G'}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-0.5 max-w-[78%]">
                      {!own && i === 0 && (
                        <p className="text-[10px] text-muted-foreground ml-0.5">Support</p>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                          own
                            ? `bg-primary text-primary-foreground rounded-br-sm ${msg.isOptimistic ? 'opacity-60' : ''}`
                            : 'bg-card text-foreground border border-border/60 rounded-bl-sm'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            own ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'
                          }`}
                        >
                          {msg.createdAt ? formatTime(msg.createdAt) : ''}
                          {msg.isOptimistic && ' · Sending…'}
                        </p>
                      </div>
                    </div>

                    {/* Own user avatar */}
                    {own && (
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {auth.user?.profilePicture ? (
                          <img
                            src={auth.user.profilePicture}
                            alt="You"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-primary">{userInitials}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {typingIndicator && (
              <div className="flex items-end gap-2 justify-start">
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-primary-foreground">A</span>
                </div>
                <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <span className="inline-flex gap-1">
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
            <div className="p-4 border-t border-border bg-muted/20 space-y-2.5 shrink-0">
              <p className="text-xs text-center text-muted-foreground">
                Chat ended — thank you for contacting us!
              </p>
              <button
                onClick={handleStartNewChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Start a new conversation
              </button>
            </div>
          ) : connectionError ? null : (
            <div className="p-3.5 border-t border-border shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={conversationId ? 'Type a message…' : 'Connecting…'}
                  disabled={!conversationId}
                  className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40 resize-none leading-relaxed max-h-24 overflow-y-auto"
                  style={{ scrollbarWidth: 'none' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !conversationId}
                  className="h-10 w-10 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary-dark transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          )}
        </div>
      )}

      {/* FAB toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-dark transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
        aria-label={open ? 'Close chat' : 'Open support chat'}
      >
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
            open ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
          }`}
        >
          <X className="h-5 w-5" />
        </span>
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
            open ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'
          }`}
        >
          <MessageCircle className="h-6 w-6" />
        </span>

        {/* Unread badge */}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

export default ChatWidget;
