import axiosInstance from './axiosInstance';

//Public
export async function getProductReviewsService(productId, params = {}) {
  try {
    const { data } = await axiosInstance.get(`/api/reviews/product/${productId}`, { params });
    return data;
  } catch (error) {
    console.error('getProductReviews error:', error?.response?.data || error.message);
    throw error;
  }
}

// Authenticated User

export async function createReviewService(reviewData) {
  try {
    const { data } = await axiosInstance.post('/api/reviews', reviewData);
    return data;
  } catch (error) {
    console.error('createReview error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function updateReviewService(reviewId, reviewData) {
  try {
    const { data } = await axiosInstance.put(`/api/reviews/${reviewId}`, reviewData);
    return data;
  } catch (error) {
    console.error('updateReview error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function deleteReviewService(reviewId) {
  try {
    const { data } = await axiosInstance.delete(`/api/reviews/${reviewId}`);
    return data;
  } catch (error) {
    console.error('deleteReview error:', error?.response?.data || error.message);
    throw error;
  }
}
