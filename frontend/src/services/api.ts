import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse, User, Post, Story, Message, Conversation } from '../types';
import { sanitizeObject, tokenStorage } from '../utils/security';
import { trackApiCall } from '../utils/performance';

// Define custom interface for request config to include metadata
interface RequestConfigWithMetadata extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

// In development, let the proxy in package.json handle the API URL
// In production, use the environment variable or fallback URL
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api'  // This will be proxied to http://localhost:5000/api via the proxy setting
  : (process.env.REACT_APP_API_URL || 'https://uplive-the-indian-social-media.onrender.com/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and debug
api.interceptors.request.use((config) => {
  // Add performance tracking
  config.metadata = { startTime: performance.now() };
  const token = tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Only log in development mode
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DISABLE_CONSOLE_LOGS !== 'true') {
    console.log('📤 REQUEST CONFIG:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      dataType: config.data?.constructor?.name,
      isFormData: config.data instanceof FormData,
    });
  }
  
  // Handle FormData content type
  if (config.data instanceof FormData) {
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DISABLE_CONSOLE_LOGS !== 'true') {
      console.log('📄 FormData detected - Content-Type will be set by browser');
    }
    // Remove Content-Type to let browser set multipart/form-data with boundary
    delete config.headers['Content-Type'];
  } 
  // Sanitize request data if it's a regular object (not FormData)
  else if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
    config.data = sanitizeObject(config.data);
  }
  
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    // Track API call performance
    const startTime = response.config.metadata?.startTime;
    if (startTime && response.config.url) {
      trackApiCall(response.config.url, startTime);
    }
    
    // Only log in development mode
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DISABLE_CONSOLE_LOGS !== 'true') {
      console.log('API Response SUCCESS:', {
        status: response.status,
        url: response.config.url,
        method: response.config.method,
        dataType: typeof response.data,
        responseTime: startTime ? `${Math.round(performance.now() - startTime)}ms` : 'unknown'
      });
    }
    return response;
  },
  (error) => {
    // Track API call performance even for errors
    const startTime = error.config?.metadata?.startTime;
    if (startTime && error.config?.url) {
      trackApiCall(error.config.url, startTime);
    }
    
    // Only log detailed errors in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error DETAILED:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        responseData: error.response?.data,
        isNetworkError: !error.response,
        isTimeout: error.code === 'ECONNABORTED'
      });
      
      // Handle specific error types
      if (!error.response) {
        // Network error - no response received
        console.error('NETWORK ERROR: No response from server');
      }
    } else {
      // In production, only log minimal error info
      console.error(`API Error: ${error.response?.status || 'Network Error'} - ${error.message}`);
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      tokenStorage.removeToken();
      localStorage.removeItem('user');
      
      // Don't redirect if we're already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) => api.post<{ message: string; requiresVerification?: boolean }>('/auth/register', userData),
  
  verifyEmail: (token: string) =>
    api.post<AuthResponse>('/auth/verify-email', { token }),
  
  resendVerification: (email: string) =>
    api.post<{ message: string }>('/auth/resend-verification', { email }),
  
  getCurrentUser: () => api.get<User>('/auth/me'),
  
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post<AuthResponse>('/auth/reset-password', { token, password }),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),
};

// Users API
export const usersApi = {
  getProfile: (username: string) => api.get<User>(`/users/${username}`),
  
  updateProfile: (data: FormData) => api.put<User>('/users/profile', data),
  
  updateProfileSettings: (data: { hasSeenWelcome?: boolean; [key: string]: any }) => 
    api.put<User>('/users/profile/settings', data),
  
  followUser: (userId: string) =>
    api.post<{ following: boolean; followerCount: number; isPrivate?: boolean; requestSent?: boolean; requested?: boolean; message: string }>(`/users/${userId}/follow`),
  
  cancelFollowRequest: (userId: string) =>
    api.delete<{ requested: boolean; message: string }>(`/users/${userId}/follow-request`),
  
  // Privacy and Follow Request Management
  updatePrivacySetting: (isPrivate: boolean) => 
    api.put<User>('/users/privacy', { isPrivate }),
  
  removeFollower: (userId: string) => 
    api.delete<{ success: boolean }>(`/users/${userId}/follower`),
  
  sendFollowRequest: (userId: string) => 
    api.post<{ success: boolean; message: string }>(`/users/${userId}/follow-request`),
  
  acceptFollowRequest: (requestId: string) => 
    api.post<{ success: boolean }>(`/users/follow-requests/${requestId}/accept`),
  
  declineFollowRequest: (requestId: string) => 
    api.post<{ success: boolean }>(`/users/follow-requests/${requestId}/decline`),
  
  getFollowRequests: () => 
    api.get<any[]>('/users/follow-requests'),
  
  checkFollowRequestSent: (userId: string) => 
    api.get<{ requestSent: boolean }>(`/users/${userId}/follow-request-status`),
  
  searchUsers: (query: string) => api.get<User[]>(`/users/search/${query}`),
  
  getSuggestions: () => api.get<User[]>('/users/suggestions/for-you'),

  getUserPosts: (userId: string) => api.get<Post[]>(`/posts/user/${userId}`),
  
  getFollowers: (userId: string) => api.get<User[]>(`/users/${userId}/followers`),
  
  getFollowing: (userId: string) => api.get<User[]>(`/users/${userId}/following`),
  
  checkUsername: (username: string) => api.get<{ available: boolean; message: string }>(`/users/check-username/${username}`),
};

// Posts API
export const postsApi = {
  getFeed: (page = 1, limit = 10) =>
    api.get<Post[]>(`/posts/feed?page=${page}&limit=${limit}`),
  
  getAllPosts: () => api.get<Post[]>('/posts/all'),
  
  getPost: (postId: string) => api.get<Post>(`/posts/${postId}`),
  
  createPost: (data: FormData) => {
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DISABLE_CONSOLE_LOGS !== 'true') {
      console.log('🚀 Sending POST request to /posts with FormData');
    }
    // Remove any Content-Type header to let browser set multipart/form-data automatically
    return api.post<Post>('/posts', data, {
      timeout: 300000, // 5 minutes for large file uploads
    });
  },
  
  likePost: (postId: string) =>
    api.post<{ liked: boolean; likeCount: number }>(`/posts/${postId}/like`),
  
  editPost: (postId: string, data: { caption?: string }) =>
    api.put<Post>(`/posts/${postId}`, data),
  
  addComment: (postId: string, text: string) =>
    api.post(`/posts/${postId}/comments`, { text }),
  
  getComments: (postId: string) =>
    api.get<{ comments: any[]; commentCount: number }>(`/posts/${postId}/comments`),
  
  deletePost: (postId: string) => api.delete(`/posts/${postId}`),
  
  getExplorePosts: (page = 1, limit = 20) =>
    api.get<Post[]>(`/posts/explore/posts?page=${page}&limit=${limit}`),
};

// Stories API
export const storiesApi = {
  getFeed: () => api.get<{ user: User; stories: Story[]; hasUnseenStories: boolean }[]>('/stories/feed'),
  
  getUserStories: (userId: string) => api.get<{ user: User; stories: Story[]; totalCount: number }>(`/stories/user/${userId}`),
  
  getStory: (storyId: string) => api.get<Story>(`/stories/${storyId}`),
  
  getStoryViewers: (storyId: string) => api.get<{ viewCount: number; viewers: { user: User; viewedAt: string }[] }>(`/stories/${storyId}/viewers`),
  
  markStoryViewed: (storyId: string) => api.post(`/stories/${storyId}/view`),
  
  createStory: (data: FormData) => api.post<Story>('/stories', data),
  
  deleteStory: (storyId: string) => api.delete(`/stories/${storyId}`),
};

// Messages API
export const messagesApi = {
  getConversations: () => api.get<Conversation[]>('/messages/conversations'),
  
  getMessages: (userId: string, page = 1, limit = 50) =>
    api.get<Message[]>(`/messages/${userId}?page=${page}&limit=${limit}`),
  
  sendMessage: (userId: string, data: FormData) =>
    api.post<Message>(`/messages/${userId}`, data),
  
  deleteMessage: (messageId: string) => api.delete(`/messages/${messageId}`),
  
  deleteConversation: (userId: string) => api.delete(`/messages/conversation/${userId}`),
  
  getUnreadCount: () => api.get<{ count: number }>('/messages/unread-count'),
  
  getConversationStatus: (userId: string) => 
    api.get<{ 
      lastSentMessage: any; 
      lastSeenAt: string | null; 
      hasUnreadMessages: boolean; 
    }>(`/messages/${userId}/status`),
};

// Follow API
export const followApi = {
  followUser: (userId: string) =>
    api.post<{ following: boolean; followerCount: number }>(`/users/${userId}/follow`),
  
  unfollowUser: (userId: string) =>
    api.delete<{ following: boolean; followerCount: number }>(`/users/${userId}/follow`),
  
  getFollowers: (userId: string) => api.get<User[]>(`/users/${userId}/followers`),
  
  getFollowing: (userId: string) => api.get<User[]>(`/users/${userId}/following`),
  
  isFollowing: (userId: string) => 
    api.get<{ following: boolean }>(`/users/${userId}/follow-status`),
};

// Notifications API
export const notificationsApi = {
  getNotifications: () => api.get('/notifications'),
  
  markAsRead: (notificationId: string) => 
    api.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  approveFollowRequest: (notificationId: string) => 
    api.post<{ message: string; follower: User }>(`/notifications/${notificationId}/approve-follow`),
  
  declineFollowRequest: (notificationId: string) => 
    api.post<{ message: string }>(`/notifications/${notificationId}/decline-follow`),
  
  followBack: (notificationId: string) => 
    api.post<{ message: string; following?: boolean; requestSent?: boolean }>(`/notifications/${notificationId}/follow-back`),
};

export default api;