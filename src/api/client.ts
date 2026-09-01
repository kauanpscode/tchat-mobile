import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import * as SecureStore from 'expo-secure-store';

const API_BASE_URL : string = process.env.EXPO_PUBLIC_API_URL;

const api : AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 5000,
});

api.interceptors.request.use(async (config : InternalAxiosRequestConfig) : Promise <InternalAxiosRequestConfig> => {
  const token = await SecureStore.getItemAsync('user_token');

  if (token) {
    config.headers.set ('Authorization',`Bearer ${token}`);
  }
  return config;
}, (error : AxiosError) : Promise <never> => {
  return Promise.reject(error);
});

export default api;