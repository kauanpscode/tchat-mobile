import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { useCompanyTheme } from '../hooks/useCompanyTheme';
import LoginScreen from '../screens/LoginScreen';
import ConversasScreen from '../screens/ConversasScreen';
import ChatScreen from '../screens/ChatScreen';

export type RootStackParamList = {
  Login: undefined;
  Conversas: undefined;
  Chat: {
    nome: string;
    conversaId: number;
    avatarUrl?: string | null;
    isGroup?: boolean;
    destinatarioId?: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { authenticated, loading } = useAuth();
  const theme = useCompanyTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {authenticated ? (
          <>
            <Stack.Screen
              name="Conversas"
              component={ConversasScreen}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}