import axiosInstance from './axiosInstance';

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await axiosInstance.post('/media/upload', formData);

  return data;
};
