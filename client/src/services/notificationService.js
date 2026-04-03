import axiosInstance from './axiosInstance';

export const getNotificationsService = async (page = 1, limit = 10) => {
  const { data } = await axiosInstance.get('/api/notifications', { params: { page, limit } });
  return data;
};

export const getUnreadCountService = async () => {
  const { data } = await axiosInstance.get('/api/notifications/unread-count');
  return data;
};

export const markAsReadService = async (id) => {
  const { data } = await axiosInstance.patch(`/api/notifications/${id}/read`);
  return data;
};

export const markAllAsReadService = async () => {
  const { data } = await axiosInstance.patch('/api/notifications/read-all');
  return data;
};
