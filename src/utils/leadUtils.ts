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

export const normalizeStatus = (status: string | null | undefined): string => {
  if (!status) return 'Status Desconhecido';
  
  const trimmedStatus = status.trim();
  return STATUS_MAPPING[trimmedStatus] || 'Status Desconhecido';
};

export const formatCurrency = (value: string | number): string => {
  if (typeof value === 'string') {
    // Remove currency symbol and handle Brazilian number format
    value = parseFloat(value.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.'));
  }
  
  if (isNaN(value)) return 'R$ 0,00';
  
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export const isValidStatus = (status: string): boolean => {
  return status in STATUS_MAPPING;
};