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
