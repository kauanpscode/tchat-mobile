// src/utils/formatters.js

/**
 * Formata um número para o padrão de telefone brasileiro:
 * Fixo: (XX) XXXX-XXXX
 * Celular: (XX) XXXXX-XXXX
 */
export function formatPhoneNumber(value = '') {
  const rawValue = value.replace(/\D/g, '');
  const limitedValue = rawValue.slice(0, 11);

  if (limitedValue.length <= 2) {
    return limitedValue.length > 0 ? `(${limitedValue}` : '';
  }
  if (limitedValue.length <= 6) {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
  }
  if (limitedValue.length <= 10) {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 6)}-${limitedValue.slice(6)}`;
  }
  return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7, 11)}`;
}