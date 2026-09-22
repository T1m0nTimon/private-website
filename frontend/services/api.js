import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API base URL - adjust for your environment
// For Android emulator: use 10.0.2.2 for localhost
// For iOS simulator: use localhost
// For physical devices: use your computer's IP address
const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api'
});

// Token storage key
const TOKEN_KEY = 'auth_token';

// Store JWT token
const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token', error);
  }
};

// Get JWT token
const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token', error);
    return null;
  }
};

// Remove token
const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token', error);
  }
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: headers
  });

  // Handle token expiration
  if (response.status === 401) {
    await removeToken();
    // Optionally redirect to login screen
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'API request failed');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),

  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),

  me: () => apiRequest('/auth/me'),

  logout: () => apiRequest('/auth/logout', {
    method: 'POST'
  })
};

// Post API
export const postAPI = {
  getAll: () => apiRequest('/posts'),
  getPost: (postId) => apiRequest(`/posts/${postId}`),

  create: (postData) => {
    const formData = new FormData();
    if (postData.media) {
      formData.append('media', {
        uri: postData.media.uri,
        type: postData.media.type,
        name: postData.media.fileName || 'media.jpg'
      });
    }
    if (postData.caption !== undefined) {
      formData.append('caption', postData.caption);
    }

    return fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData - let browser set it
        Authorization: `Bearer ${await getToken()}`
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }
      return response.json();
    });
  },

  like: (postId) => apiRequest(`/posts/${postId}/like`, {
    method: 'POST'
  }),

  unlike: (postId) => apiRequest(`/posts/${postId}/like`, {
    method: 'DELETE'
  }),

  getComments: (postId) => apiRequest(`/posts/${postId}/comments`),

  createComment: (postId, content) => apiRequest(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),

  deletePost: (postId) => apiRequest(`/posts/${postId}`, {
    method: 'DELETE'
  })
};

// User API
export const userAPI = {
  follow: (userId) => apiRequest(`/users/${userId}/follow`, {
    method: 'POST'
  }),

  unfollow: (userId) => apiRequest(`/users/${userId}/follow`, {
    method: 'DELETE'
  }),

  getProfile: (userId) => apiRequest(`/users/${userId}`),

  getFollowed: () => apiRequest(`/users/followed`),

  getUserPosts: (userId) => apiRequest(`/users/${userId}/posts`),

  searchUsers: (username) => apiRequest(`/users/search/${username}`)
};

// Upload API (alternative)
export const uploadAPI = {
  upload: (fileUri) => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'image/jpeg', // or detect properly
      name: 'upload.jpg'
    });

    return fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getToken()}`
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      return response.json();
    });
  }
};

export default {
  auth: authAPI,
  post: postAPI,
  user: userAPI,
  upload: uploadAPI
};