// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
    
  },
});

// Global URL case normalizer (for all endpoints)
api.interceptors.request.use(config => {
  if (config.url && /^\/[A-Z]/.test(config.url)) {
    const correctedUrl = config.url.replace(/^\/([A-Z])/, (_, letter) => 
      `/${letter.toLowerCase()}`
    );
    console.warn(`⚠️ Correcting URL case: ${config.url} → ${correctedUrl}`);
    config.url = correctedUrl;
  }
  return config;
});

// Add login method that handles field name conversion
api.login = async (credentials) => {
  // Convert frontend's 'email' to backend's 'emailOrPhone'
  const backendCredentials = {
    emailOrPhone: credentials.email, // or credentials.phone if using phone
    password: credentials.password
  };
  
  return api.post('/auth/login', backendCredentials);
};

api.interceptors.response.use(
  response => response,
  error => {
    console.error('🔥 Axios Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data, // 👈 This shows the actual 400 response
    });
    return Promise.reject(error);
  }
);

// Automatically attach JWT token if available
api.interceptors.request.use((config) => {
  console.log('Request:', config.method, config.url, config.params);
  const token = localStorage.getItem("jwtToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.request.use(config => {
  console.log('📤 Outgoing Request:', config.url, config.params);
  return config;
});

export default api;
