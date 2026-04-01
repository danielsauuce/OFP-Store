import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Loader,
  X,
  UserCircle2,
  Circle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { getConversationsService, getMessagesService } from '../../services/chatService';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Circle, className: 'text-amber-500' },
  active: { label: 'Active', icon: CheckCircle2, className: 'text-green-500' },
  closed: { label: 'Closed', icon: XCircle, className: 'text-muted-foreground' },
};

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
  const typingTimeoutRef = useRef(null);
  const selectedConvRef = useRef(null);

  selectedConvRef.current = selectedConv;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) return;

    const socket = io(`${BACKEND_URL}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect_error', (err) => {
      toast.error(`Chat connection failed: ${err.message}`);
    });

    // Message received in current conversation
    socket.on('chat:message', (msg) => {
      const currentConvId = selectedConvRef.current?.conversationId;

      if (
        msg.conversationId === currentConvId ||
        msg.conversationId === selectedConvRef.current?._id
      ) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          return exists ? prev : [...prev, msg];
        });
      }

      // Update conversation list — increment unread if not currently viewing
      setConversations((prev) =>
        prev.map((c) => {
          const convId = c.conversationId;
          if (convId !== msg.conversationId) return c;
          const isViewing = selectedConvRef.current?.conversationId === convId;
          return {
            ...c,
            lastMessage: msg.message,
            lastMessageAt: msg.createdAt,
            unreadByAdmin: isViewing ? 0 : (c.unreadByAdmin || 0) + 1,
          };
        }),
      );
    });

    // New conversation or message from customer — add conversation if not in list
    socket.on('chat:new-message', ({ conversationId, message }) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c.conversationId === conversationId);
        if (!exists) {
          // New conversation — add to top with unknown customer until REST refetch
          const newConv = {
            conversationId,
            status: 'pending',
            lastMessage: message.message,
            lastMessageAt: message.createdAt,
            unreadByAdmin: 1,
            userId: message.sender?.userId || null,
          };
          return [newConv, ...prev];
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
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers({});
        }, 3000);
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
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversationsService();
        if (data?.success) setConversations(data.conversations);
      } catch {
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const handleSelectConversation = async (conv) => {
    if (selectedConv?.conversationId === conv.conversationId) return;

    setSelectedConv(conv);
    setMessagesLoading(true);
    setMessages([]);
    setTypingUsers({});

    // Clear unread badge immediately
    setConversations((prev) =>
      prev.map((c) => (c.conversationId === conv.conversationId ? { ...c, unreadByAdmin: 0 } : c)),
    );

    try {
      const data = await getMessagesService(conv.conversationId);
      if (data?.success) setMessages(data.messages);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }

    if (socketRef.current) {
      socketRef.current.emit('chat:join-conversation', {
        conversationId: conv.conversationId,
      });
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

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getCustomerName = (conv) => {
    if (conv.userId?.fullName) return conv.userId.fullName;
    if (conv.userId?.email) return conv.userId.email;
    if (conv.conversationId) return conv.conversationId.replace('conv:', 'Customer ');
    return 'Unknown Customer';
  };

  const anyTyping = Object.values(typingUsers).some(Boolean);

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-4">
      {/* Conversation list */}
      <div className="w-72 bg-card border border-border rounded-lg overflow-hidden flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Support Inbox
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {conversations.filter((c) => c.status === 'pending').length} pending
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const StatusIcon = STATUS_CONFIG[conv.status]?.icon || Circle;
              const isSelected = selectedConv?.conversationId === conv.conversationId;
              return (
                <button
                  key={conv.conversationId || conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-primary/8 border-l-2 border-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      <UserCircle2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium text-foreground truncate">
                          {getCustomerName(conv)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {conv.unreadByAdmin > 0 && (
                            <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                              {conv.unreadByAdmin > 9 ? '9+' : conv.unreadByAdmin}
                            </span>
                          )}
                          <StatusIcon
                            className={`h-3 w-3 ${STATUS_CONFIG[conv.status]?.className || ''}`}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
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

      {/* Message panel */}
      <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col min-w-0">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground space-y-3">
              <MessageSquare className="h-12 w-12 mx-auto opacity-30" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the inbox to start replying</p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{getCustomerName(selectedConv)}</h3>
                {selectedConv.userId?.email && (
                  <p className="text-xs text-muted-foreground">{selectedConv.userId.email}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    selectedConv.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : selectedConv.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {STATUS_CONFIG[selectedConv.status]?.label || selectedConv.status}
                </span>
                {selectedConv.status !== 'closed' && (
                  <button
                    onClick={handleClose}
                    className="flex items-center gap-1.5 text-xs text-destructive hover:bg-destructive/10 px-2.5 py-1 rounded-md transition-colors border border-destructive/30"
                  >
                    <X className="h-3 w-3" />
                    Close Chat
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No messages yet
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
                          <p className="text-[11px] font-semibold mb-1 opacity-60">
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
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-1">
                    <span className="inline-flex gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                    </span>
                    <span className="ml-1">Customer is typing</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {selectedConv.status === 'closed' ? (
              <div className="px-5 py-4 border-t border-border bg-muted/30 text-center text-sm text-muted-foreground">
                This conversation is closed
              </div>
            ) : (
              <div className="p-4 border-t border-border flex gap-3 items-end">
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
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary-dark transition-colors flex items-center gap-2 shrink-0"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
