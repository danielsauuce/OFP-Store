import axiosInstance from './axiosInstance';

export const getConversationsService = async () => {
  const { data } = await axiosInstance.get('/api/chat/conversations');
  return data;
};

export const getMessagesService = async (conversationId, page = 1, limit = 50) => {
  if (!conversationId) throw new TypeError('conversationId is required');
  const encodedId = encodeURIComponent(conversationId);
  const { data } = await axiosInstance.get(`/api/chat/conversations/${encodedId}/messages`, {
    params: { page, limit },
  });
  return data;
};

export const createConversationService = async () => {
  const { data } = await axiosInstance.post('/api/chat/conversations');
  return data;
};
