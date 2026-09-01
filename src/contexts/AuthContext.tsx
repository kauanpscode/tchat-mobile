import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';

export interface User {
  id: number | string;
  name: string;
  phone: string;
  avatar?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthContextData {
  authenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await SecureStore.getItemAsync('user_token');
        const storedUser = await SecureStore.getItemAsync('user_data');

        if (storedToken && storedUser) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setUser(JSON.parse(storedUser) as User);
        }
      } catch (error) {
        console.error('Erro ao carregar dados locais:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStorageData();
  }, []);

  async function login(phone: string, password: string) {
    const response = await api.post<LoginResponse>('/login', { phone, password });

    const { token, user: userData } = response.data;

    if (!token) {
      throw new Error('Token não foi encontrado na resposta da API.');
    }

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    await SecureStore.setItemAsync('user_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));

    setUser(userData);
  }

  async function logout() {
    delete api.defaults.headers.common['Authorization'];
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_data');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ authenticated: !!user, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }

  return context;
}