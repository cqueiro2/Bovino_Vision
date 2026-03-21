export interface BovineDetection {
  id: number;
  classe: "bovino";
  confianca: number;
  caixa_delimitadora: {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
  };
}

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
  lista_de_bovinos?: BovineDetection[];
}

export type ViewMode = 'dashboard' | 'analysis' | 'history' | 'settings' | 'whatsapp';
