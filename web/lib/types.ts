export type Status = "propria" | "impropria" | "indeterminado";

export interface Ponto {
  id: string;
  codigo_ima: string;
  praia: string;
  municipio: string;
  municipio_slug: string;
  ponto_num: number | null;
  descricao: string;
  lat: number | null;
  lon: number | null;
  ultimo_status: Status | null;
  ultima_coleta: string | null;
  semanas_proprias_consecutivas: number;
  pct_proprias_historico: number | null;
  total_coletas: number;
  tem_historico_pdf: boolean;
}

export interface Municipio {
  slug: string;
  nome: string;
  n_pontos: number;
  n_proprias: number;
  n_improprias: number;
  n_sem_dados: number;
  pct_proprias: number | null;
  lat: number | null;
  lon: number | null;
}

export interface Medicao {
  data: string;
  status: Status;
  relatorio?: number;
  temporada?: string;
  nmp?: number | null;
  chuva?: string;
  temp_agua?: number | null;
  fonte?: "pdf" | "api";
}

export interface PontoHistorico {
  ponto: Ponto;
  historico: Medicao[];
}

export interface Resumo {
  data: string;
  relatorio: number;
  temporada: string;
  arquivo: string;
  floripa_proprias: number;
  floripa_improprias: number;
  interior_proprias: number;
  interior_improprias: number;
  total: number;
  pct_proprias: number | null;
}

export interface Meta {
  ultima_atualizacao: string;
  total_pontos: number;
  total_proprias: number;
  total_improprias: number;
  total_municipios: number;
  total_relatorios: number;
  total_medicoes: number;
}
