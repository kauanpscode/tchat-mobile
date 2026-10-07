import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export function usePresenca() {
  const { authenticated } = useAuth();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!authenticated) return;

    // Dispara ping inicial ao autenticar
    api.post('/presenca/ping').catch(() => {});

    // Intervalo de ping a cada 45 segundos enquanto o app estiver aberto
    const interval = setInterval(() => {
      if (appState.current === 'active') {
        api.post('/presenca/ping').catch(() => {});
      }
    }, 45000);

    // Listener para transições de estado do aplicativo (Background / Inactive / Active)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App voltou para primeiro plano -> envia ping
        api.post('/presenca/ping').catch(() => {});
      } else if (nextAppState.match(/inactive|background/)) {
        // App foi para segundo plano -> envia status offline
        api.post('/presenca/offline').catch(() => {});
      }
      appState.current = nextAppState;
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
      // Ao desmontar (ex: logout)
      api.post('/presenca/offline').catch(() => {});
    };
  }, [authenticated]);
}
