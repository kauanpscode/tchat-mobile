// src/styles/theme.js

export const colors = {
  // Azul Claro / Ciano da barra superior e botões
  primary: '#00A3FF',       // Azul vibrante do header e cards
  primaryDark: '#0077CC',   // Variação para bordas e sombras
  secondary: '#00C2FF',     // Azul ciano mais claro (botões circulares)
  accent: '#0084FF',        // Destaque para ações principais

  // Cores de Acento / Notificações (extraídas dos cards do dashboard)
  purple: '#6C28D6',        // Roxo do card "Aniversariantes"
  danger: '#F43F5E',        // Rosa/Vermelho do card "Pendências / SAT"
  success: '#10B981',       // Verde de status

  // Fundo e Estrutura
  background: '#F1F5F9',    // Fundo cinza-azulado bem claro do app
  cardBackground: '#FFFFFF',// Fundo dos cartões brancos com cantos arredondados
  white: '#FFFFFF',

  // Tipografia
  textDark: '#1E293B',      // Títulos e números em destaque (chumbo azulado)
  textMuted: '#64748B',     // Textos secundários, legendas e subtítulos
  textLight: '#94A3B8',     // Placeholders e textos desativados

  // Balões de Mensagem (Chat)
  chatBalloonSent: '#E0F2FE',     // Azul bem suave (Tailwind Sky-100)
  chatBalloonReceived: '#FFFFFF', // Branco puro

  // Bordas, Divisores e Badges
  border: '#E2E8F0',
  badgeLightBlue: '#E0F2FE',      // Fundo dos ícones de pastinha/avatar (#E0F2FE)
  badgeLightPink: '#FFE4E6',      // Fundo suave de avisos/pendências
};