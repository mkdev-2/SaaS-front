// Map of status names and their normalized versions
export const STATUS_MAPPING: Record<string, string> = {
  'Leads de Entrada': 'Leads de Entrada',
  'Primeiro Contato': 'Primeiro Contato',
  'Conexão estabelecida': 'Conexão estabelecida',
  'Conexão estabelecida ': 'Conexão estabelecida', // Note the extra space
  'Qualificação': 'Qualificação',
  'Apresentação': 'Apresentação',
  'Proposta': 'Proposta',
  'Proposta Enviada': 'Proposta',
  'Fechamento': 'Fechamento',
  'Fechamento ': 'Fechamento', // Note the extra space
  'Venda Realizada': 'Venda Realizada',
  'Venda realizada': 'Venda Realizada',
  'venda realizada': 'Venda Realizada',
  'Pós-Venda': 'Pós-Venda',
  'Pós Vendas': 'Pós-Venda',
  'pós venda': 'Pós-Venda',
  'Perdido': 'Perdido',
  'Status Desconhecido': 'Status Desconhecido'
};

export const LEAD_STATUS_ORDER = [
  'Leads de Entrada',
  'Primeiro Contato',
  'Conexão estabelecida',
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
  'Primeiro Contato': '#99ccff',
  'Conexão estabelecida': '#ffff99',
  'Qualificação': '#F0FDFB',
  'Apresentação': '#ECFDF5',
  'Proposta': '#ffcccc',
  'Fechamento': '#fff000',
  'Venda Realizada': '#DCF9E6',
  'Pós-Venda': '#CCFF66',
  'Perdido': '#FEE2E2',
  'Status Desconhecido': '#808080'
};

export const normalizeStatus = (status: string): string => {
  // Trim any extra spaces from the status
  const trimmedStatus = status.trim();
  return STATUS_MAPPING[trimmedStatus] || 'Status Desconhecido';
};

export const formatCurrency = (value: string | number): string => {
  if (typeof value === 'string') {
    value = parseFloat(value.replace('R$ ', '').replace('.', '').replace(',', '.'));
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
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