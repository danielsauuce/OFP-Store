import axiosInstance from './axiosInstance';

export const getConversationsService = async () => {
  const { data } = await axiosInstance.get('/api/chat/conversations');
  return data;
};

export const getMessagesService = async (conversationId, page = 1, limit = 50) => {
  const { data } = await axiosInstance.get(`/api/chat/conversations/${conversationId}/messages`, {
    params: { page, limit },
  });
  return data;
};

export const createConversationService = async () => {
  const { data } = await axiosInstance.post('/api/chat/conversations');
  return data;
};
