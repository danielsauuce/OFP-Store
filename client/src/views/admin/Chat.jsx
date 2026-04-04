import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Loader,
  X,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  User,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { getConversationsService, getMessagesService } from '../../services/chatService';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const STATUS_CONFIG = {
  pending: {
    label: 'Waiting',
    icon: Clock,
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  active: {
    label: 'Active',
    icon: CheckCircle2,
    bg: 'bg-green-100',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getCustomerName(conv) {
  if (conv.userId?.fullName) return conv.userId.fullName;
  if (conv.userId?.email) return conv.userId.email.split('@')[0];
  if (conv.displayName && conv.displayName !== 'Guest') return conv.displayName;
  if (conv.guestId) return 'Guest';
  return 'Customer';
}

function getCustomerEmail(conv) {
  return conv.userId?.email || null;
}

function getCustomerAvatar(conv) {
  const pic = conv.userId?.profilePicture;
  if (!pic || typeof pic === 'string') return null;
  return pic.secureUrl || pic.url || null;
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ src, name, size = 'md' }) {
  const dim = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';
  return (
    <div
      className={`${dim} rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0`}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold text-primary">{getInitials(name || '?')}</span>
      )}
    </div>
  );
}

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedConvRef = useRef(null);
  const inputRef = useRef(null);

  selectedConvRef.current = selectedConv;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Socket setup
  useEffect(() => {
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) return;

    const socket = io(`${BACKEND_URL}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect_error', (err) => toast.error(`Chat connection failed: ${err.message}`));

    socket.on('chat:message', (msg) => {
      const currentConvId = selectedConvRef.current?.conversationId;
      if (msg.conversationId === currentConvId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          return exists ? prev : [...prev, msg];
        });
        // Update lastMessage for active conversation only — unread logic owned by chat:new-message
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === msg.conversationId
              ? { ...c, lastMessage: msg.message, lastMessageAt: msg.createdAt }
              : c,
          ),
        );
      }
    });

    socket.on('chat:new-message', ({ conversationId, message }) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c.conversationId === conversationId);
        if (!exists) {
          return [
            {
              conversationId,
              status: 'pending',
              lastMessage: message.message,
              lastMessageAt: message.createdAt,
              unreadByAdmin: 1,
              userId: message.sender?.userId || null,
            },
            ...prev,
          ];
        }
        return prev.map((c) =>
          c.conversationId === conversationId
            ? {
                ...c,
                lastMessage: message.message,
                lastMessageAt: message.createdAt,
                unreadByAdmin:
                  selectedConvRef.current?.conversationId === conversationId
                    ? 0
                    : (c.unreadByAdmin || 0) + 1,
              }
            : c,
        );
      });
    });

    socket.on('chat:typing', ({ isTyping }) => {
      setTypingUsers((prev) => ({ ...prev, typing: isTyping }));
      if (isTyping) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUsers({}), 3000);
      }
    });

    socket.on('chat:closed', ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((c) => (c.conversationId === conversationId ? { ...c, status: 'closed' } : c)),
      );
      if (selectedConvRef.current?.conversationId === conversationId) {
        setSelectedConv((prev) => (prev ? { ...prev, status: 'closed' } : prev));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Load conversations
  const fetchConversations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getConversationsService();
      if (data?.success) setConversations(data.conversations);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelectConversation = async (conv) => {
    if (selectedConv?.conversationId === conv.conversationId) return;
    const requestId = conv.conversationId;
    setSelectedConv(conv);
    setMessagesLoading(true);
    setMessages([]);
    setTypingUsers({});
    setConversations((prev) =>
      prev.map((c) => (c.conversationId === conv.conversationId ? { ...c, unreadByAdmin: 0 } : c)),
    );
    socketRef.current?.emit('chat:join-conversation', { conversationId: conv.conversationId });
    setTimeout(() => inputRef.current?.focus(), 100);
    try {
      const data = await getMessagesService(conv.conversationId);
      if (selectedConvRef.current?.conversationId === requestId && data?.success) {
        setMessages(data.messages);
      }
    } catch {
      if (selectedConvRef.current?.conversationId === requestId) {
        toast.error('Failed to load messages');
      }
    } finally {
      if (selectedConvRef.current?.conversationId === requestId) {
        setMessagesLoading(false);
      }
    }
  };

  const handleSend = useCallback(() => {
    if (!input.trim() || !selectedConv || !socketRef.current) return;
    if (selectedConv.status === 'closed') return;
    socketRef.current.emit('chat:send', {
      conversationId: selectedConv.conversationId,
      message: input.trim(),
    });
    setInput('');
    inputRef.current?.focus();
  }, [input, selectedConv]);

  const handleClose = useCallback(() => {
    if (!selectedConv || !socketRef.current) return;
    socketRef.current.emit('chat:close', { conversationId: selectedConv.conversationId });
    setSelectedConv((prev) => (prev ? { ...prev, status: 'closed' } : prev));
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === selectedConv.conversationId ? { ...c, status: 'closed' } : c,
      ),
    );
    toast.success('Conversation closed');
  }, [selectedConv]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const anyTyping = Object.values(typingUsers).some(Boolean);

  const filteredConversations = conversations.filter((conv) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = getCustomerName(conv).toLowerCase();
    const email = getCustomerEmail(conv)?.toLowerCase() || '';
    return name.includes(q) || email.includes(q);
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadByAdmin || 0), 0);

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-5">
      {/* ── Sidebar ── */}
      <div className="w-72 xl:w-80 bg-card border border-border rounded-xl overflow-hidden flex flex-col shrink-0 shadow-sm">
        {/* Sidebar header */}
        <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-primary" />
              Support Inbox
              {totalUnread > 0 && (
                <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {conversations.filter((c) => c.status === 'pending').length} waiting
            </p>
          </div>
          <button
            onClick={() => fetchConversations(true)}
            disabled={refreshing}
            title="Refresh conversations"
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 gap-2 text-center px-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground opacity-30" />
              <p className="text-xs text-muted-foreground">
                {search ? 'No matching conversations' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConv?.conversationId === conv.conversationId;
              const cfg = STATUS_CONFIG[conv.status] || STATUS_CONFIG.pending;
              const name = getCustomerName(conv);
              const email = getCustomerEmail(conv);

              return (
                <button
                  key={conv.conversationId || conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left px-3 py-3 transition-colors border-b border-border/50 last:border-0 ${
                    isSelected
                      ? 'bg-primary/8 border-l-[3px] border-l-primary pl-[9px]'
                      : 'hover:bg-muted/40 border-l-[3px] border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar src={getCustomerAvatar(conv)} name={name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-sm font-medium text-foreground truncate leading-tight">
                          {name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          {conv.unreadByAdmin > 0 && (
                            <span className="min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                              {conv.unreadByAdmin > 9 ? '9+' : conv.unreadByAdmin}
                            </span>
                          )}
                          <span className={`h-2 w-2 rounded-full ${cfg.dot} shrink-0`} />
                        </div>
                      </div>
                      {email && (
                        <p className="text-[10px] text-muted-foreground truncate">{email}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatTime(conv.lastMessageAt || conv.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Message Panel ── */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col min-w-0 shadow-sm">
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary/60" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No conversation selected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pick a conversation from the inbox to start replying
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={getCustomerAvatar(selectedConv)}
                  name={getCustomerName(selectedConv)}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm leading-tight truncate">
                    {getCustomerName(selectedConv)}
                  </p>
                  {getCustomerEmail(selectedConv) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {getCustomerEmail(selectedConv)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(() => {
                  const cfg = STATUS_CONFIG[selectedConv.status] || STATUS_CONFIG.pending;
                  return (
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}
                    >
                      {cfg.label}
                    </span>
                  );
                })()}
                {selectedConv.status !== 'closed' && (
                  <button
                    onClick={handleClose}
                    className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-2.5 py-1 rounded-lg transition-colors border border-destructive/30"
                  >
                    <X className="h-3 w-3" />
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 bg-muted/10">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <User className="h-8 w-8 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isAdmin = msg.sender?.role === 'admin';
                  const senderName =
                    msg.sender?.userId?.fullName ||
                    msg.sender?.senderName ||
                    (msg.sender?.role === 'guest' ? 'Guest' : 'Customer');
                  const rawPic = msg.sender?.userId?.profilePicture;
                  const avatarUrl =
                    rawPic && typeof rawPic !== 'string'
                      ? rawPic.secureUrl || rawPic.url || null
                      : null;

                  return (
                    <div
                      key={msg._id || i}
                      className={`flex items-end gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isAdmin && <Avatar src={avatarUrl} name={senderName} size="sm" />}
                      <div
                        className={`max-w-[68%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                          isAdmin
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-card text-foreground border border-border rounded-bl-md'
                        }`}
                      >
                        {!isAdmin && (
                          <p className="text-[10px] font-semibold mb-0.5 opacity-60">
                            {senderName}
                          </p>
                        )}
                        <p className="leading-relaxed">{msg.message}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isAdmin
                              ? 'text-primary-foreground/60 text-right'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary-foreground">A</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {anyTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground">C</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {selectedConv.status === 'closed' ? (
              <div className="px-5 py-3.5 border-t border-border bg-muted/20 text-center">
                <p className="text-xs text-muted-foreground">This conversation has been closed</p>
              </div>
            ) : (
              <div className="p-4 border-t border-border">
                <div className="flex gap-2 items-end">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Reply to customer…"
                    className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="h-10 w-10 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary-dark transition-colors flex items-center justify-center shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
                  Press Enter to send
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
