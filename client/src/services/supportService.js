import axiosInstance from './axiosInstance';

export async function createTicketService(ticketData) {
  try {
    const { data } = await axiosInstance.post('/api/support', ticketData);
    return data;
  } catch (error) {
    console.error('createTicket error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getMyTicketsService() {
  try {
    const { data } = await axiosInstance.get('/api/support/my-tickets');
    return data;
  } catch (error) {
    console.error('getMyTickets error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getTicketByIdService(ticketId) {
  try {
    const { data } = await axiosInstance.get(`/api/support/${ticketId}`);
    return data;
  } catch (error) {
    console.error('getTicketById error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function addTicketReplyService(ticketId, text) {
  try {
    const { data } = await axiosInstance.post(`/api/support/${ticketId}/reply`, { text });
    return data;
  } catch (error) {
    console.error('addTicketReply error:', error?.response?.data || error.message);
    throw error;
  }
}
