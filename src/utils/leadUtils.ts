import { LeadStatus } from '../types/dashboard';

export const LEAD_STATUSES: Record<number, LeadStatus> = {
  // Etapa de Leads de Entrada
  143: {
    name: 'Leads de Entrada',
    color: '#E5F6FD',
    textColor: '#0369A1'
  },
  // Primeiro Contato
  142: {
    name: 'Primeiro Contato',
    color: '#F0F9FF',
    textColor: '#0284C7'
  },
  // Qualificação
  32392157: {
    name: 'Qualificação',
    color: '#F0FDFB',
    textColor: '#0D9488'
  },
  // Apresentação
  32392160: {
    name: 'Apresentação',
    color: '#ECFDF5',
    textColor: '#059669'
  },
  // Proposta
  32392163: {
    name: 'Proposta',
    color: '#FEF9C3',
    textColor: '#CA8A04'
  },
  // Fechamento
  142: {
    name: 'Fechamento',
    color: '#DCF9E6',
    textColor: '#16A34A'
  },
  // Perdido
  143: {
    name: 'Perdido',
    color: '#FEE2E2',
    textColor: '#DC2626'
  }
};

export const getLeadStatus = (statusId: number): LeadStatus => {
  return LEAD_STATUSES[statusId] || {
    name: 'Status Desconhecido',
    color: '#F3F4F6',
    textColor: '#4B5563'
  };
};