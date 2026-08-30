import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Image,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { AuthContext } from '../contexts/AuthContext';
import { colors } from '../styles/theme';
import { formatPhoneNumber } from '../utils/formatters';

const conversas = [
  {
    id: '4',
    name: 'Equipe de Devs 🚀',
    lastMessage: 'Lucas: A release de produção já foi subida.',
    time: 'Ontem',
    unreadCount: 0,
    isGroup: true,
  },
];

export default function ConversasScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  
  // Estados para controlar o Menu e o Perfil
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || null);

  const primaryColor = colors.primary || '#00A3FF';

  // Função para abrir a galeria e selecionar uma foto
  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos para trocar o avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImageUri = result.assets[0].uri;
      setAvatarUri(selectedImageUri);

      // TODO: Aqui você pode disparar a função de upload (FormData) para sua API PHP:
      // uploadAvatarToApi(selectedImageUri);
      Alert.alert('Sucesso', 'Foto atualizada com sucesso!');
    }
  }

  function renderConversaItem({ item }) {
    return (
      <TouchableOpacity
        style={styles.chatItem}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('Chat', {
            nome: item.name,
            conversaId: item.id,
          })
        }
      >
        <View style={styles.avatarContainer}>
          <Ionicons
            name={item.isGroup ? 'people' : 'person'}
            size={26}
            color={colors.primary}
          />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeaderRow}>
            <Text style={styles.chatName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.chatTime, item.unreadCount > 0 && styles.chatTimeActive]}>
              {item.time}
            </Text>
          </View>

          <View style={styles.chatMessageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>

            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />

      {/* Header com os 3 pontinhos */}
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        <Text style={styles.headerTitle}>Tchat</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="search" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Botão dos 3 pontinhos */}
          <TouchableOpacity 
            style={styles.headerIconBtn} 
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-header com saudação rápida */}
      <View style={styles.greetingBar}>
        <Text style={styles.greetingText}>
          Conectado como <Text style={styles.greetingName}>{user?.name || 'Kauan Pontes'}</Text>
        </Text>
      </View>

      {/* Lista de Conversas */}
      <FlatList
        data={conversas}
        keyExtractor={(item) => item.id}
        renderItem={renderConversaItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Botão Flutuante (FAB) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent || '#0084FF' }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Chat', { nome: 'Nova Conversa' })}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 1. Modal Dropdown dos 3 Pontinhos */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.dropdownOverlay}>
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setMenuVisible(false);
                  setProfileModalVisible(true);
                }}
              >
                <Ionicons name="person-outline" size={20} color={colors.textDark} />
                <Text style={styles.dropdownItemText}>Meu Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dropdownItem, styles.dropdownItemBorder]}
                onPress={() => {
                  setMenuVisible(false);
                  logout();
                }}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.danger || '#F43F5E'} />
                <Text style={[styles.dropdownItemText, { color: colors.danger || '#F43F5E' }]}>
                  Sair
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 2. Modal Completo de Exibição/Edição de Perfil */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileTitle}>Dados do Perfil</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Foto de Perfil com Botão de Alterar */}
            <View style={styles.avatarSection}>
              <View style={styles.profileAvatar}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.profileAvatarImg} />
                ) : (
                  <Ionicons name="person" size={54} color={colors.primary} />
                )}
              </View>
              <TouchableOpacity 
                style={[styles.cameraBadge, { backgroundColor: primaryColor }]} 
                onPress={handlePickImage}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Nome</Text>
                  <Text style={styles.infoValue}>{user?.name || 'Kauan Pontes'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Telefone</Text>
                  <Text style={styles.infoValue}>
                    {formatPhoneNumber(user?.phone || '41995511804')}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>ID do Colaborador</Text>
                  <Text style={styles.infoValue}>#{user?.id || '3'}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: primaryColor }]}
              onPress={() => setProfileModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    marginLeft: 16,
    padding: 4,
  },
  greetingBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greetingText: {
    fontSize: 12,
    color: '#64748B',
  },
  greetingName: {
    fontWeight: '600',
    color: '#1E293B',
  },
  listContent: {
    paddingBottom: 80,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  chatTimeActive: {
    color: '#00A3FF',
    fontWeight: '600',
  },
  chatMessageRow: {
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
  unreadBadge: {
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 82,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // Menu 3 Pontinhos
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 170,
    paddingVertical: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1E293B',
    marginLeft: 12,
    fontWeight: '500',
  },
  // Modal de Perfil
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  infoSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  closeBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});