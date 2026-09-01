import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../styles/theme';

export type RootStackParamList = {
  Conversas: undefined;
  Chat: {
    nome: string;
    conversaId?: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { nome, conversaId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sala de conversa: {nome}</Text>
      {conversaId && <Text style={styles.subText}>ID: {conversaId}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: colors.textDark || '#1E293B',
    fontWeight: '600',
  },
  subText: {
    fontSize: 13,
    color: colors.textMuted || '#94A3B8',
    marginTop: 4,
  },
});