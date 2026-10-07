/* eslint-disable import/no-named-as-default-member */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:80/tchat-api/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 8000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (err) {
      console.warn('Erro ao ler token no SecureStore:', err);
    }
    return config;
  },
  (error: AxiosError): Promise<never> => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const errorData = error.response.data as { message?: string; messages?: { error?: string } } | undefined;
      const errorMsg = errorData?.messages?.error || errorData?.message || '';
      if (errorMsg.includes('não possui vínculo ativo') || errorMsg.includes('desativada') || errorMsg.includes('Token inválido')) {
        try {
          await SecureStore.deleteItemAsync('user_token');
          await SecureStore.deleteItemAsync('user_data');
        } catch {
          // ignore
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;