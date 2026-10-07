import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useCompanyTheme } from '../hooks/useCompanyTheme';
import { usePresenca } from '../hooks/usePresenca';
import { formatPhoneNumber } from '../utils/formatters';
import api from '../api/client';
import { Conversa, EmpresaDisponivel } from '../types';
import ItemConversa from '../components/ItemConversa';
import ModalColaboradores from '../components/ModalColaboradores';

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

type Props = NativeStackScreenProps<RootStackParamList, 'Conversas'>;

export default function ConversasScreen({ navigation }: Props) {
  const { user, empresa, empresasDisponiveis, logout, updateUser, trocarEmpresa } = useAuth();
  const theme = useCompanyTheme();

  // Ativa o heartbeat de presença em tempo real
  usePresenca();

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modais
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);
  const [switchCompanyModalVisible, setSwitchCompanyModalVisible] = useState<boolean>(false);
  const [modalColaboradoresVisible, setModalColaboradoresVisible] = useState<boolean>(false);

  const carregarConversas = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await api.get('/conversas');
      const data: Conversa[] = response.data?.data || [];
      setConversas(data);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/conversas')
      .then((response) => {
        if (!isMounted) return;
        setConversas(response.data?.data || []);
        setLoading(false);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Erro ao carregar conversas:', error);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [empresa?.id]);

  // Atualizar lista ao focar na tela
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarConversas(false);
    });
    return unsubscribe;
  }, [navigation, carregarConversas]);

  // Função para abrir galeria e atualizar avatar
  async function handlePickImage(): Promise<void> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso às suas fotos para trocar o avatar.'
      );
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
      try {
        const formData = new FormData();
        const avatarData = {
          uri: selectedImageUri,
          name: `avatar_${user?.id}.jpg`,
          type: 'image/jpeg',
        };

        formData.append('avatar', avatarData as unknown as Blob);
        const response = await api.post('/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const newAvatarUrl = response.data?.avatar_url || response.data?.data?.avatar_url;
        if (newAvatarUrl) {
          await updateUser({ avatar_url: newAvatarUrl });
          Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao enviar imagem:', error);
        Alert.alert('Erro', 'Não foi possível atualizar a foto.');
      }
    }
  }

  async function handleTrocarEmpresa(novaEmpresa: EmpresaDisponivel) {
    try {
      setSwitchCompanyModalVisible(false);
      setLoading(true);
      await trocarEmpresa(novaEmpresa.id);
      Alert.alert('Ambiente Corporativo', `Você agora está conectado em ${novaEmpresa.nome_fantasia || novaEmpresa.nome}`);
    } catch (error) {
      console.error('Erro ao trocar empresa:', error);
      Alert.alert('Erro', 'Não foi possível alternar de empresa.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* Header Corporativo com Identidade da Empresa */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.companyInfo}>
          {theme.empresaLogo ? (
            <Image source={{ uri: theme.empresaLogo }} style={styles.companyLogo} />
          ) : (
            <Ionicons name="business" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
          )}
          <View>
            <Text style={styles.companyName} numberOfLines={1}>
              {theme.empresaNome}
            </Text>
            <Text style={styles.headerRole}>
              {user?.cargo === 'admin' ? 'Administrador' : 'Colaborador'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-header com Saudação */}
      <View style={styles.greetingBar}>
        <Text style={styles.greetingText}>
          Olá, <Text style={styles.greetingName}>{user?.name}</Text>
        </Text>
        <Text style={styles.tenantTag}>
          Ambiente Corporativo
        </Text>
      </View>

      {/* Lista de Conversas */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Carregando suas conversas...</Text>
        </View>
      ) : (
        <FlatList
          data={conversas}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => carregarConversas(true)}
              colors={[theme.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Nenhuma conversa no momento</Text>
              <Text style={styles.emptySub}>
                Toque no botão abaixo para iniciar uma nova conversa com um colega da {theme.empresaNome}.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ItemConversa
              conversa={item}
              primaryColor={theme.primary}
              onPress={() =>
                navigation.navigate('Chat', {
                  conversaId: Number(item.id),
                  nome: item.nome,
                  avatarUrl: item.imagem || item.destinatario?.avatar,
                  isGroup: item.tipo === 'G',
                  destinatarioId: item.destinatario?.id,
                })
              }
            />
          )}
        />
      )}

      {/* Botão Flutuante (FAB) para Novo Chat */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        activeOpacity={0.85}
        onPress={() => setModalColaboradoresVisible(true)}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal de Seleção de Colaboradores */}
      <ModalColaboradores
        visible={modalColaboradoresVisible}
        onClose={() => setModalColaboradoresVisible(false)}
        primaryColor={theme.primary}
        onSelectConversa={(conversaId, nomeContato) => {
          navigation.navigate('Chat', {
            conversaId,
            nome: nomeContato,
          });
        }}
      />

      {/* 1. Modal Dropdown (3 pontinhos) */}
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
                <Ionicons name="person-outline" size={20} color="#1E293B" />
                <Text style={styles.dropdownItemText}>Meu Perfil</Text>
              </TouchableOpacity>

              {empresasDisponiveis.length > 1 && (
                <TouchableOpacity
                  style={[styles.dropdownItem, styles.dropdownItemBorder]}
                  onPress={() => {
                    setMenuVisible(false);
                    setSwitchCompanyModalVisible(true);
                  }}
                >
                  <Ionicons name="swap-horizontal-outline" size={20} color="#1E293B" />
                  <Text style={styles.dropdownItemText}>Trocar Empresa</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.dropdownItem, styles.dropdownItemBorder]}
                onPress={() => {
                  setMenuVisible(false);
                  logout();
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#F43F5E" />
                <Text style={[styles.dropdownItemText, { color: '#F43F5E' }]}>
                  Sair
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 2. Modal do Perfil */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileTitle}>Perfil Corporativo</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Foto de Perfil */}
            <View style={styles.avatarSection}>
              <View style={styles.profileAvatar}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.profileAvatarImg} />
                ) : (
                  <Ionicons name="person" size={54} color={theme.primary} />
                )}
              </View>
              <TouchableOpacity
                style={[styles.cameraBadge, { backgroundColor: theme.primary }]}
                onPress={handlePickImage}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={theme.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Nome</Text>
                  <Text style={styles.infoValue}>{user?.name}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={theme.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Telefone</Text>
                  <Text style={styles.infoValue}>{formatPhoneNumber(user?.phone)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={20} color={theme.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Organização Atual</Text>
                  <Text style={styles.infoValue}>{theme.empresaNome}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Cargo</Text>
                  <Text style={styles.infoValue}>
                    {user?.cargo === 'admin' ? 'Administrador' : 'Colaborador'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.primary }]}
              onPress={() => setProfileModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Modal de Troca de Empresa */}
      <Modal
        visible={switchCompanyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSwitchCompanyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileTitle}>Alternar Ambiente</Text>
              <TouchableOpacity onPress={() => setSwitchCompanyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.switchHelpText}>
              Selecione qual empresa você deseja acessar agora:
            </Text>

            <FlatList
              data={empresasDisponiveis}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isActive = item.id === empresa?.id;
                return (
                  <TouchableOpacity
                    style={[styles.companyCardOption, isActive && styles.companyCardActive]}
                    onPress={() => handleTrocarEmpresa(item)}
                  >
                    <View style={styles.companyIconWrap}>
                      <Ionicons
                        name="business"
                        size={22}
                        color={isActive ? theme.primary : '#64748B'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.companyOptionName, isActive && { color: theme.primary }]}>
                        {item.nome_fantasia || item.nome}
                      </Text>
                      <Text style={styles.companyOptionCargo}>Cargo: {item.cargo}</Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
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
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 8,
  },
  companyName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRole: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    marginLeft: 12,
    padding: 4,
  },
  greetingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greetingText: {
    fontSize: 13,
    color: '#64748B',
  },
  greetingName: {
    fontWeight: '600',
    color: '#1E293B',
  },
  tenantTag: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  listContent: {
    paddingBottom: 80,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 82,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 36,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
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
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 52,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 180,
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
    maxHeight: '85%',
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
    marginBottom: 20,
  },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    right: '36%',
    width: 32,
    height: 32,
    borderRadius: 16,
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
  switchHelpText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
  },
  companyCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  companyCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  companyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  companyOptionCargo: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
