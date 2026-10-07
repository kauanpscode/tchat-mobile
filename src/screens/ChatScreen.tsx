import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../api/client';
import { Mensagem } from '../types';
import HeaderChat from '../components/HeaderChat';
import BalaoMensagem from '../components/BalaoMensagem';
import { useCompanyTheme } from '../hooks/useCompanyTheme';

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

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { nome, conversaId, avatarUrl, isGroup = false, destinatarioId } = route.params;
  const theme = useCompanyTheme();

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const carregarMensagens = useCallback(async () => {
    try {
      const response = await api.get(`/conversas/${conversaId}/mensagens`, {
        params: { limite: 50 },
      });
      const data: Mensagem[] = response.data?.data || [];
      setMensagens(data);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  }, [conversaId]);

  // Marca conversa como lida ao abrir e gerencia carregamento + polling
  useEffect(() => {
    let isMounted = true;
    api.post(`/conversas/${conversaId}/ler`).catch(() => {});

    api
      .get(`/conversas/${conversaId}/mensagens`, { params: { limite: 50 } })
      .then((response) => {
        if (!isMounted) return;
        setMensagens(response.data?.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Erro ao buscar mensagens:', error);
        if (isMounted) setLoading(false);
      });

    if (destinatarioId && !isGroup) {
      api
        .get(`/presenca/${destinatarioId}`)
        .then((response) => {
          if (!isMounted) return;
          setIsOnline(response.data?.data?.status === 'online');
        })
        .catch(() => {});
    }

    // Polling a cada 3 segundos para novas mensagens enquanto conversa está aberta
    pollingRef.current = setInterval(() => {
      api
        .get(`/conversas/${conversaId}/mensagens`, { params: { limite: 50 } })
        .then((response) => {
          if (!isMounted) return;
          setMensagens(response.data?.data || []);
        })
        .catch(() => {});

      if (destinatarioId && !isGroup) {
        api
          .get(`/presenca/${destinatarioId}`)
          .then((response) => {
            if (!isMounted) return;
            setIsOnline(response.data?.data?.status === 'online');
          })
          .catch(() => {});
      }
    }, 3000);

    return () => {
      isMounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [conversaId, destinatarioId, isGroup]);

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Conceda acesso à galeria para enviar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  }

  async function handleEnviar() {
    if (!inputText.trim() && !selectedImage) return;

    try {
      setSending(true);

      if (selectedImage) {
        // Envio com Anexo (multipart/form-data)
        const formData = new FormData();
        formData.append('id_conversa', String(conversaId));
        if (inputText.trim()) {
          formData.append('mensagem', inputText.trim());
        }

        const anexoObj = {
          uri: selectedImage,
          name: `upload_${Date.now()}.jpg`,
          type: 'image/jpeg',
        };
        formData.append('anexo', anexoObj as unknown as Blob);

        await api.post('/mensagens', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Envio de Texto simples
        await api.post('/mensagens', {
          id_conversa: conversaId,
          mensagem: inputText.trim(),
        });
      }

      setInputText('');
      setSelectedImage(null);
      await carregarMensagens();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem. Verifique sua conexão.');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header do WhatsApp */}
      <HeaderChat
        nome={nome}
        avatarUrl={avatarUrl}
        isOnline={isOnline}
        isGroup={isGroup}
        onBack={() => navigation.goBack()}
        primaryColor={theme.primary}
      />

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Lista de Mensagens */}
        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Carregando mensagens...</Text>
          </View>
        ) : (
          <FlatList
            data={mensagens}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <BalaoMensagem
                mensagem={item}
                primaryColor={theme.primary}
                isGroup={isGroup}
              />
            )}
            inverted={true}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>
                  Nenhuma mensagem aqui ainda.{'\n'}Diga olá para iniciar a conversa!
                </Text>
              </View>
            }
          />
        )}

        {/* Pré-visualização de imagem anexada */}
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removePreviewBtn}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Barra de Entrada de Mensagem */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handlePickImage}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="camera-outline" size={24} color="#64748B" />
          </TouchableOpacity>

          <TextInput
            style={[styles.textInput, { maxHeight: 100 }]}
            placeholder="Mensagem"
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline={true}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: theme.primary },
              (!inputText.trim() && !selectedImage) && styles.sendBtnDisabled,
            ]}
            onPress={handleEnviar}
            disabled={sending || (!inputText.trim() && !selectedImage)}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5DDD5', // Cor clássica de papel de parede do WhatsApp
  },
  chatArea: {
    flex: 1,
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  messagesList: {
    paddingVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    transform: [{ scaleY: -1 }], // Desinverte o empty component no FlatList inverted
  },
  emptyText: {
    marginTop: 10,
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 8,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  removePreviewBtn: {
    marginLeft: 10,
    padding: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attachBtn: {
    padding: 8,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 40,
    marginRight: 6,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
});