import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import api from '../api/client';
import { Colaborador } from '../types';
import { formatPhoneNumber } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

interface ModalColaboradoresProps {
  visible: boolean;
  onClose: () => void;
  onSelectConversa: (conversaId: number, nome: string) => void;
  primaryColor?: string;
}

export default function ModalColaboradores({
  visible,
  onClose,
  onSelectConversa,
  primaryColor = '#00A3FF',
}: ModalColaboradoresProps) {
  const { user, empresa } = useAuth();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingChatId, setCreatingChatId] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    api
      .get('/empresa/colaboradores')
      .then((response) => {
        if (!isMounted) return;
        const lista: Colaborador[] = response.data?.data || [];
        const filtrados = lista.filter((c) => Number(c.id) !== Number(user?.id));
        setColaboradores(filtrados);
        setLoading(false);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Erro ao carregar colaboradores:', error);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, user?.id]);

  function handleClose() {
    setSearch('');
    onClose();
  }

  async function handleIniciarConversa(colaborador: Colaborador) {
    try {
      setCreatingChatId(colaborador.id);
      const response = await api.post('/conversas/privada', {
        destinatario_id: colaborador.id,
      });

      const conversaId = response.data?.data?.conversa_id;
      if (conversaId) {
        handleClose();
        onSelectConversa(conversaId, colaborador.name);
      } else {
        Alert.alert('Atenção', 'Não foi possível iniciar a conversa.');
      }
    } catch (error: unknown) {
      console.error('Erro ao criar conversa privada:', error);
      let msg = 'Erro ao conectar com colaborador.';
      if (isAxiosError(error) && error.response?.data?.message) {
        msg = error.response.data.message;
      }
      Alert.alert('Erro', msg);
    } finally {
      setCreatingChatId(null);
    }
  }

  const colaboradoresFiltrados = colaboradores.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header do Modal */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Novo Chat</Text>
            <Text style={styles.headerSubtitle}>
              {empresa?.nome_fantasia || empresa?.nome || 'Minha Empresa'}
            </Text>
          </View>
        </View>

        {/* Barra de Pesquisa */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            placeholder="Pesquisar colega pelo nome..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de Colaboradores */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>Buscando equipe...</Text>
          </View>
        ) : (
          <FlatList
            data={colaboradoresFiltrados}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>
                  {search ? 'Nenhum colega encontrado com esse nome.' : 'Nenhum outro colaborador ativo encontrado nesta empresa.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isOnline = item.status_presenca === 'online';
              const isStarting = creatingChatId === item.id;

              return (
                <TouchableOpacity
                  style={styles.cardColaborador}
                  activeOpacity={0.7}
                  disabled={isStarting}
                  onPress={() => handleIniciarConversa(item)}
                >
                  <View style={styles.avatarWrap}>
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name="person" size={22} color={primaryColor} />
                      </View>
                    )}
                    <View
                      style={[
                        styles.onlineDot,
                        { backgroundColor: isOnline ? '#10B981' : '#94A3B8' },
                      ]}
                    />
                  </View>

                  <View style={styles.infoColaborador}>
                    <Text style={styles.nomeColaborador}>{item.name}</Text>
                    <Text style={styles.detalhesColaborador}>
                      {formatPhoneNumber(item.phone)} •{' '}
                      <Text style={styles.cargoText}>
                        {item.cargo === 'admin' ? 'Administrador' : 'Colaborador'}
                      </Text>
                    </Text>
                  </View>

                  {isStarting ? (
                    <ActivityIndicator size="small" color={primaryColor} />
                  ) : (
                    <Ionicons name="chatbubble-outline" size={22} color={primaryColor} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Modal>
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
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  closeBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    margin: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  listContent: {
    paddingBottom: 30,
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
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 14,
  },
  cardColaborador: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  infoColaborador: {
    flex: 1,
  },
  nomeColaborador: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  detalhesColaborador: {
    fontSize: 13,
    color: '#64748B',
  },
  cargoText: {
    color: '#0284C7',
    fontWeight: '500',
  },
});
