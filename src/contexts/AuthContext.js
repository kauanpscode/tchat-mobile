import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await SecureStore.getItemAsync('user_token');
        const storedUser = await SecureStore.getItemAsync('user_data');

        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Erro ao carregar dados locais:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStorageData();
  }, []);

  // src/contexts/AuthContext.js
  async function login(phone, password) {
    console.log('📱 Tentando login com:', { phone, password });

    const response = await api.post('/login', { phone, password });
    console.log('📦 Resposta da API:', response.data);

    // Verifique se a estrutura bate com o que a API realmente retorna
    const { token, user: userData } = response.data;

    console.log('🔑 Token extraído:', token);
    console.log('👤 Usuário extraído:', userData);

    if (!token) {
      throw new Error('Token não foi encontrado na resposta da API.');
    }

    await SecureStore.setItemAsync('user_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));

    setUser(userData);
  }


  async function logout() {
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