import { Platform } from 'react-native';
import api from '../api/client';

/**
 * Serviço de registro de token de notificações Push junto ao backend Tchat API.
 * Endpoint: POST /api/push/register
 */
export async function registrarPushToken(token) {
  if (!token) return;

  try {
    const response = await api.post('/push/register', {
      token: token,
      plataforma: Platform.OS, // 'android' ou 'ios'
    });
    return response.data;
  } catch (error) {
    console.warn('Erro ao registrar push token no backend:', error);
    throw error;
  }
}
