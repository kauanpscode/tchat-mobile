import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversa } from '../types';
import { formatTimeAgo } from '../utils/formatters';
import { colors } from '../styles/theme';

interface ItemConversaProps {
  conversa: Conversa;
  onPress: () => void;
  primaryColor?: string;
}

export default function ItemConversa({ conversa, onPress, primaryColor = colors.primary }: ItemConversaProps) {
  const isGroup = conversa.tipo === 'G';
  const lastMsg = conversa.ultima_mensagem;
  const timeDisplay = formatTimeAgo(lastMsg?.criado_em || conversa.ultima_atividade_em);

  let previewText = 'Nenhuma mensagem';
  if (lastMsg?.texto) {
    previewText = lastMsg.texto;
  } else if (lastMsg?.tipo === 'imagem') {
    previewText = '📷 Foto';
  } else if (lastMsg?.tipo === 'arquivo') {
    previewText = '📎 Documento';
  }

  const avatarUrl = conversa.imagem || conversa.destinatario?.avatar;

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7} onPress={onPress}>
      {/* Avatar */}
      <View style={[styles.avatarContainer, { backgroundColor: '#E2E8F0' }]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <Ionicons
            name={isGroup ? 'people' : 'person'}
            size={24}
            color={primaryColor}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.nome} numberOfLines={1}>
            {conversa.nome}
          </Text>
          <Text
            style={[
              styles.time,
              conversa.nao_lidas > 0 && { color: primaryColor, fontWeight: '700' },
            ]}
          >
            {timeDisplay}
          </Text>
        </View>

        <View style={styles.bodyRow}>
          <Text
            style={[
              styles.lastMessage,
              conversa.nao_lidas > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {previewText}
          </Text>

          <View style={styles.badgesRow}>
            {conversa.fixada && (
              <Ionicons name="pin" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
            )}
            {conversa.nao_lidas > 0 && (
              <View style={[styles.badge, { backgroundColor: primaryColor }]}>
                <Text style={styles.badgeText}>
                  {conversa.nao_lidas > 99 ? '99+' : conversa.nao_lidas}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },
  lastMessageUnread: {
    color: '#0F172A',
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
