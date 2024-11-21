import { LeadStatus } from '../types/dashboard';

// Updated status IDs based on your Kommo CRM configuration
export const LEAD_STATUSES: Record<string, LeadStatus> = {
  '32392154': {
    name: 'Leads de Entrada',
    color: '#E5F6FD',
    textColor: '#0369A1'
  },
  '32392155': {
    name: 'Primeiro Contato',
    color: '#F0F9FF',
    textColor: '#0284C7'
  },
  '32392157': {
    name: 'Qualificação',
    color: '#F0FDFB',
    textColor: '#0D9488'
  },
  '32392160': {
    name: 'Apresentação',
    color: '#ECFDF5',
    textColor: '#059669'
  },
  '32392163': {
    name: 'Proposta',
    color: '#FEF9C3',
    textColor: '#CA8A04'
  },
  '32392166': {
    name: 'Fechamento',
    color: '#DCF9E6',
    textColor: '#16A34A'
  },
  '32392169': {
    name: 'Perdido',
    color: '#FEE2E2',
    textColor: '#DC2626'
  }
};
export const LEAD_STATUS_ORDER = [
    'Leads de Entrada',
    'Primeiro Contato',
    'Qualificação',
    'Apresentação',
    'Proposta',
    'Fechamento',
    'Venda Realizada',
    'Pós-Venda',
    'Perdido',
    'Status Desconhecido'
  ];
  
  export const STATUS_COLORS = {
    'Leads de Entrada': '#E5F6FD',
    'Primeiro Contato': '#F0F9FF',
    'Qualificação': '#F0FDFB',
    'Apresentação': '#ECFDF5',
    'Proposta': '#FEF9C3',
    'Fechamento': '#F0FDF4',
    'Venda Realizada': '#DCF9E6',
    'Pós-Venda': '#32CD32',
    'Perdido': '#FEE2E2',
    'Status Desconhecido': '#808080'
  };

export interface LeadDetails {
  status: LeadStatus;
  source?: string;
  lastInteraction?: Date;
}

export const getLeadStatus = (statusId: number): LeadStatus => {
  return LEAD_STATUSES[statusId.toString()] || {
    name: 'Status Desconhecido',
    color: '#F3F4F6',
    textColor: '#4B5563'
  };
};

export const findSourceTag = (tags: any[]): string | undefined => {
  if (!Array.isArray(tags)) return undefined;
  const sourceTag = tags.find(tag => 
    tag.name?.toLowerCase().includes('origem:') || 
    tag.name?.toLowerCase().includes('canal:')
  );
  return sourceTag ? sourceTag.name.split(':')[1]?.trim() : undefined;
};

export const getLastInteraction = (events: any[]): Date | undefined => {
  if (!Array.isArray(events) || events.length === 0) return undefined;
  
  const lastEvent = events
    .filter(event => event.type === 'note' || event.type === 'message')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
  return lastEvent ? new Date(lastEvent.created_at) : undefined;
};

export const formatLeadSummary = (lead: any): LeadDetails => {
  return {
    status: getLeadStatus(lead.status_id),
    source: findSourceTag(lead.tags),
    lastInteraction: getLastInteraction(lead.events)
  };
};