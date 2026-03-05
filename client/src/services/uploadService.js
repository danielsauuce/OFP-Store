import axiosInstance from './axiosInstance';

export async function uploadImageService(file, folder = 'general') {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const { data } = await axiosInstance.post('/api/media/upload/single', formData);
    return data;
  } catch (error) {
    console.error('uploadImage error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function uploadMultipleImagesService(files, folder = 'general') {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    formData.append('folder', folder);

    const { data } = await axiosInstance.post('/api/media/upload/multiple', formData);
    return data;
  } catch (error) {
    console.error('uploadMultipleImages error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getAllMediaService(params = {}) {
  try {
    const { data } = await axiosInstance.get('/api/media/upload/all', { params });
    return data;
  } catch (error) {
    console.error('getAllMedia error:', error?.response?.data || error.message);
    throw error;
  }
}
