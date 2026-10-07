import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';
import { User, Empresa, EmpresaDisponivel } from '../types';

interface LoginResponse {
  status: number;
  message: string;
  token: string;
  user: User;
  empresa: Empresa;
  empresas_disponiveis?: EmpresaDisponivel[];
}

interface TrocarEmpresaResponse {
  status: number;
  message: string;
  token: string;
  empresa: Empresa;
}

interface AuthContextData {
  authenticated: boolean;
  user: User | null;
  empresa: Empresa | null;
  empresasDisponiveis: EmpresaDisponivel[];
  loading: boolean;
  login: (phone: string, password: string, empresaId?: number) => Promise<void>;
  logout: () => Promise<void>;
  trocarEmpresa: (empresaId: number) => Promise<void>;
  updateUser: (updatedUserData: Partial<User>) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<EmpresaDisponivel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await SecureStore.getItemAsync('user_token');
        const storedUser = await SecureStore.getItemAsync('user_data');
        const storedEmpresa = await SecureStore.getItemAsync('empresa_data');
        const storedEmpresas = await SecureStore.getItemAsync('empresas_disponiveis');

        if (storedToken && storedUser) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setUser(JSON.parse(storedUser) as User);

          if (storedEmpresa) {
            setEmpresa(JSON.parse(storedEmpresa) as Empresa);
          }
          if (storedEmpresas) {
            setEmpresasDisponiveis(JSON.parse(storedEmpresas) as EmpresaDisponivel[]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados locais de autenticação:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStorageData();
  }, []);

  async function login(phone: string, password: string, empresaId?: number) {
    const payload: { phone: string; password: string; empresa_id?: number } = {
      phone,
      password,
    };
    if (empresaId) {
      payload.empresa_id = empresaId;
    }

    const response = await api.post<LoginResponse>('/login', payload);
    const { token, user: userData, empresa: empresaData, empresas_disponiveis } = response.data;

    if (!token) {
      throw new Error('Token não foi encontrado na resposta da API.');
    }

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    await SecureStore.setItemAsync('user_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
    if (empresaData) {
      await SecureStore.setItemAsync('empresa_data', JSON.stringify(empresaData));
      setEmpresa(empresaData);
    }
    if (empresas_disponiveis) {
      await SecureStore.setItemAsync('empresas_disponiveis', JSON.stringify(empresas_disponiveis));
      setEmpresasDisponiveis(empresas_disponiveis);
    }

    setUser(userData);
  }

  async function trocarEmpresa(empresaId: number) {
    try {
      const response = await api.post<TrocarEmpresaResponse>('/empresa/trocar', {
        empresa_id: empresaId,
      });

      const { token, empresa: novaEmpresa } = response.data;
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await SecureStore.setItemAsync('user_token', token);
      }
      if (novaEmpresa) {
        await SecureStore.setItemAsync('empresa_data', JSON.stringify(novaEmpresa));
        setEmpresa(novaEmpresa);
      }
    } catch (error) {
      console.error('Erro ao alternar de empresa:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      // Notifica o backend para marcar presença como offline
      await api.post('/presenca/offline').catch(() => {});
    } catch {
      // Ignora falha de rede no logout
    } finally {
      delete api.defaults.headers.common['Authorization'];
      await SecureStore.deleteItemAsync('user_token');
      await SecureStore.deleteItemAsync('user_data');
      await SecureStore.deleteItemAsync('empresa_data');
      await SecureStore.deleteItemAsync('empresas_disponiveis');
      setUser(null);
      setEmpresa(null);
      setEmpresasDisponiveis([]);
    }
  }

  async function updateUser(updatedUserData: Partial<User>) {
    if (!user) return;
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
  }

  return (
    <AuthContext.Provider
      value={{
        authenticated: !!user,
        user,
        empresa,
        empresasDisponiveis,
        login,
        logout,
        trocarEmpresa,
        loading,
        updateUser,
      }}
    >
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