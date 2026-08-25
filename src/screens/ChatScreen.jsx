import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/theme';

export default function ChatScreen({ route }) {
  const { nome } = route.params || { nome: 'Chat' };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sala de conversa: {nome}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: colors.textDark },
});