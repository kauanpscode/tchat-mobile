import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { colors as defaultColors } from '../styles/theme';

export function useCompanyTheme() {
  const { empresa } = useAuth();

  const theme = useMemo(() => {
    const primary = empresa?.cor_primaria || defaultColors.primary || '#00A3FF';
    const secondary = empresa?.cor_secundaria || defaultColors.secondary || '#00C2FF';

    return {
      ...defaultColors,
      primary,
      secondary,
      empresaNome: empresa?.nome_fantasia || empresa?.nome || 'Tchat Corporativo',
      empresaLogo: empresa?.logo_url || null,
    };
  }, [empresa]);

  return theme;
}
