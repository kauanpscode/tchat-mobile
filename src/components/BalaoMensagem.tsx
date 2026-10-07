import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mensagem } from '../types';
import { formatMessageClock } from '../utils/formatters';

interface BalaoMensagemProps {
  mensagem: Mensagem;
  primaryColor?: string;
  isGroup?: boolean;
}

export default function BalaoMensagem({
  mensagem,
  isGroup = false,
}: BalaoMensagemProps) {
  const isMine = mensagem.enviado_por_mim;
  const time = formatMessageClock(mensagem.criado_em);

  return (
    <View style={[styles.container, isMine ? styles.containerRight : styles.containerLeft]}>
      <View
        style={[
          styles.balloon,
          isMine ? styles.balloonMine : styles.balloonOther,
        ]}
      >
        {/* Nome do remetente em caso de grupo e mensagem recebida */}
        {!isMine && isGroup && mensagem.usuario_nome && (
          <Text style={styles.senderName}>{mensagem.usuario_nome}</Text>
        )}

        {/* Imagem em anexo */}
        {mensagem.anexo_url && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: mensagem.anexo_url }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Mensagem de texto */}
        {mensagem.mensagem ? (
          <Text style={styles.messageText}>{mensagem.mensagem}</Text>
        ) : null}

        {/* Rodapé com Hora e Tiques */}
        <View style={styles.footer}>
          <Text style={styles.timeText}>{time}</Text>

          {isMine && (
            <View style={styles.tickContainer}>
              {mensagem.lida ? (
                <Ionicons name="checkmark-done" size={16} color="#0284C7" />
              ) : (
                <Ionicons name="checkmark-done" size={16} color="#94A3B8" />
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  containerRight: {
    justifyContent: 'flex-end',
  },
  containerLeft: {
    justifyContent: 'flex-start',
  },
  balloon: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  balloonMine: {
    backgroundColor: '#DCF8C6', // Verde clássico do WhatsApp para mensagens enviadas
    borderTopRightRadius: 2,
  },
  balloonOther: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
    marginBottom: 4,
  },
  imageContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 6,
  },
  attachmentImage: {
    width: 220,
    height: 180,
    borderRadius: 8,
  },
  messageText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
  },
  tickContainer: {
    marginLeft: 4,
  },
});
