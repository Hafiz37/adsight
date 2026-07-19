import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`
  };
};

export const adminService = {
  // Dashboard stats
  getDashboardStats: async () => {
    const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Users management
  getUsers: async (params = {}) => {
    const response = await axios.get(`${API_URL}/api/admin/users`, {
      headers: getAuthHeaders(),
      params
    });
    return response.data;
  },

  getUserDetail: async (id) => {
    const response = await axios.get(`${API_URL}/api/admin/users/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  resetPassword: async (email) => {
    const response = await axios.post(`${API_URL}/api/admin/users/reset-password`, { email }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  banUser: async (id, isBanned, reason = '') => {
    const response = await axios.put(`${API_URL}/api/admin/users/${id}/ban`, { isBanned, reason }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await axios.delete(`${API_URL}/api/admin/users/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Campaigns
  getCampaigns: async (params = {}) => {
    const response = await axios.get(`${API_URL}/api/admin/campaigns`, {
      headers: getAuthHeaders(),
      params
    });
    return response.data;
  },

  getCampaignAnalytics: async (params = {}) => {
    const response = await axios.get(`${API_URL}/api/admin/campaigns/analytics`, {
      headers: getAuthHeaders(),
      params
    });
    return response.data;
  },

  // Role management
  updateUserRole: async (id, newRole) => {
    const response = await axios.put(`${API_URL}/api/admin/users/${id}/role`, { newRole }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const response = await axios.get(`${API_URL}/api/admin/audit-logs`, {
      headers: getAuthHeaders(),
      params
    });
    return response.data;
  }
};
