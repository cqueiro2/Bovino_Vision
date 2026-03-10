export interface BovineAnalysisResult {
  id: string;
  raca: string;
  confianca_raca: number;
  peso_estimado: number;
  precisao_peso: string;
  cor_pelagem: string;
  padrao_pelagem: string;
  sexo: 'Macho' | 'Fêmea' | 'Indeterminado';
  idade_estimada: string;
  score_corporal: string;
  porte: 'Pequeno' | 'Médio' | 'Grande';
  descricao_detalhada: string;
  observacoes_especialista: string[];
  saude_geral: 'Saudável' | 'Atenção' | 'Crítico';
}

export type ViewMode = 'dashboard' | 'analysis' | 'history' | 'settings';
