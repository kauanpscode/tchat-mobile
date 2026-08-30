import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../contexts/AuthContext';
import { colors } from '../styles/theme';
import { formatPhoneNumber } from '../utils/formatters';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocusedPhone, setIsFocusedPhone] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);

  const { login } = useContext(AuthContext);

  function handlePhoneChange(text) {
    setPhone(formatPhoneNumber(text));
  }

  async function handleLogin() {
    if (!phone || !password) {
      Alert.alert('Atenção', 'Informe telefone e senha.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(phone, password);
    } catch (error) {
      console.error('❌ Erro no login:', error);
      const message =
        error.response?.data?.messages?.error ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Erro inesperado ao realizar login.';

      Alert.alert('Erro ao entrar', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="chatbubbles" size={38} color={colors.primary} />
          </View>
          <Text style={styles.title}>Tchat</Text>
          <Text style={styles.subtitle}>Conecte-se com seus amigos e contatos</Text>
        </View>

        <View style={styles.form}>
          {/* Input Telefone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefone</Text>
            <View style={[styles.inputWrapper, isFocusedPhone && styles.inputWrapperFocused]}>
              <Ionicons
                name="call-outline"
                size={20}
                color={isFocusedPhone ? colors.primary : colors.textMuted}
                style={styles.leadingIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="(11) 99999-9999"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoCapitalize="none"
                maxLength={20}
                onFocus={() => setIsFocusedPhone(true)}
                onBlur={() => setIsFocusedPhone(false)}
              />
            </View>
          </View>

          {/* Input Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={[styles.inputWrapper, isFocusedPassword && styles.inputWrapperFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isFocusedPassword ? colors.primary : colors.textMuted}
                style={styles.leadingIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setIsFocusedPassword(true)}
                onBlur={() => setIsFocusedPassword(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Avançar</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} style={styles.buttonIcon} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ao continuar, você concorda com os <Text style={styles.footerLink}>Termos de Serviço</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.chatBalloonSent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    height: '100%',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});