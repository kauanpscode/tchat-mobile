// src/utils/formatters.js

/**
 * Formata um número para o padrão de telefone brasileiro:
 * Fixo: (XX) XXXX-XXXX
 * Celular: (XX) XXXXX-XXXX
 */
export function formatPhoneNumber(value = "") {
  let rawValue = value.toString().replace(/\D/g, "");

  // 1. Tratamento para números com DDI do Brasil (12 ou 13 dígitos começando com 55)
  if (rawValue.startsWith("55") && rawValue.length >= 12) {
    const limited = rawValue.slice(0, 13);
    const ddi = limited.slice(0, 2);
    const ddd = limited.slice(2, 4);

    if (limited.length <= 4) {
      return `+${ddi} (${limited.slice(2)}`;
    }
    if (limited.length <= 8) {
      return `+${ddi} (${ddd}) ${limited.slice(4)}`;
    }
    if (limited.length <= 12) {
      // Fixo: +55 (XX) XXXX-XXXX
      return `+${ddi} (${ddd}) ${limited.slice(4, 8)}-${limited.slice(8)}`;
    }
    // Celular: +55 (XX) XXXXX-XXXX
    return `+${ddi} (${ddd}) ${limited.slice(4, 9)}-${limited.slice(9, 13)}`;
  }

  // 2. Tratamento padrão sem DDI (10 ou 11 dígitos)
  const limitedValue = rawValue.slice(0, 11);

  if (limitedValue.length <= 2) {
    return limitedValue.length > 0 ? `(${limitedValue}` : "";
  }
  if (limitedValue.length <= 6) {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
  }
  if (limitedValue.length <= 10) {
    // Fixo: (XX) XXXX-XXXX
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 6)}-${limitedValue.slice(6)}`;
  }
  // Celular: (XX) XXXXX-XXXX
  return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7, 11)}`;
}

/**
 * Formata uma data ISO ou string para exibição na lista de conversas:
 * Se hoje: "14:35"
 * Se ontem: "Ontem"
 * Outro: "DD/MM"
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (isToday) {
    return `${hours}:${minutes}`;
  }
  if (isYesterday) {
    return "Ontem";
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}`;
}

/**
 * Formata hora para balão de mensagem: "14:35"
 */
export function formatMessageClock(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
