import { PIPELINE_STATUS } from './constants';

export function calculateLeadValue(lead) {
  if (!lead) return 0;
  
  let value = 0;

  // Check catalog elements
  if (lead.catalog_elements?._embedded?.items) {
    value = lead.catalog_elements._embedded.items.reduce((sum, item) => {
      const price = parseFloat(item.price || 0);
      const quantity = parseInt(item.quantity || 1, 10);
      return sum + (price * quantity);
    }, 0);
  }

  // Check price field if no catalog elements
  if (value === 0 && lead.price) {
    value = parseFloat(lead.price);
  }

  return value;
}

export function findVendorTag(lead) {
  if (!lead.custom_fields_values) return null;

  const vendorField = lead.custom_fields_values.find(field => 
    field.field_name?.toLowerCase().includes('vendedor')
  );

  return vendorField?.values[0]?.value || null;
}

export function findSourceTag(lead) {
  if (!lead.custom_fields_values) return 'Origem não informada';

  const sourceField = lead.custom_fields_values.find(field => 
    field.field_name?.toLowerCase().includes('origem') ||
    field.field_name?.toLowerCase().includes('source')
  );

  return sourceField?.values[0]?.value || 'Origem não informada';
}

export function getContactInfo(lead) {
  if (!lead.contacts?._embedded?.contacts) return [];

  return lead.contacts._embedded.contacts.map(contact => ({
    id: contact.id,
    nome: contact.name || 'Nome não informado',
    telefone: contact.phone || '',
    email: contact.email || ''
  }));
}

export function getLeadName(lead) {
  if (!lead) return 'Lead sem nome';

  if (lead.name && lead.name !== `Lead #${lead.id}`) {
    return lead.name;
  }

  const mainContact = lead.contacts?._embedded?.contacts?.[0];
  if (mainContact?.name) {
    return mainContact.name;
  }

  return `Lead #${lead.id}`;
}

export function getLeadStatus(lead) {
  if (!lead.status) {
    return {
      id: null,
      nome: 'Status Desconhecido',
      cor: '#808080'
    };
  }

  const statusMap = {
    [PIPELINE_STATUS.LEADS_ENTRADA]: {
      nome: 'Leads de Entrada',
      cor: '#E5F6FD'
    },
    [PIPELINE_STATUS.PRIMEIRO_CONTATO]: {
      nome: 'Primeiro Contato',
      cor: '#99ccff'
    },
    [PIPELINE_STATUS.CONEXAO_ESTABELECIDA]: {
      nome: 'Conexão estabelecida',
      cor: '#ffff99'
    },
    [PIPELINE_STATUS.QUALIFICACAO]: {
      nome: 'Qualificação',
      cor: '#F0FDFB'
    },
    [PIPELINE_STATUS.APRESENTACAO]: {
      nome: 'Apresentação',
      cor: '#ECFDF5'
    },
    [PIPELINE_STATUS.PROPOSTA]: {
      nome: 'Proposta',
      cor: '#ffcccc'
    },
    [PIPELINE_STATUS.FECHAMENTO]: {
      nome: 'Fechamento',
      cor: '#fff000'
    },
    [PIPELINE_STATUS.VENDA_REALIZADA]: {
      nome: 'Venda Realizada',
      cor: '#DCF9E6'
    },
    [PIPELINE_STATUS.POS_VENDAS]: {
      nome: 'Pós-Venda',
      cor: '#CCFF66'
    },
    [PIPELINE_STATUS.PERDIDO]: {
      nome: 'Perdido',
      cor: '#FEE2E2'
    }
  };

  const status = statusMap[lead.status_id] || {
    nome: 'Status Desconhecido',
    cor: '#808080'
  };

  return {
    id: lead.status_id,
    nome: status.nome,
    cor: status.cor
  };
}

export function getLastInteraction(lead) {
  if (!lead.events?._embedded?.events) {
    return lead.created_at;
  }

  const events = lead.events._embedded.events;
  const lastEvent = events
    .filter(event => event.type === 'note' || event.type === 'message')
    .sort((a, b) => b.created_at - a.created_at)[0];

  return lastEvent ? lastEvent.created_at : lead.created_at;
}

export function isLeadSale(lead, normalizedStatus) {
  const saleStatuses = ['Venda Realizada', 'Pós-Venda', 'Fechamento'];
  return saleStatuses.includes(normalizedStatus);
}

export function normalizeStatus(status) {
  const statusMap = {
    'Leads de Entrada': 'Leads de Entrada',
    'Primeiro Contato': 'Primeiro Contato',
    'Conexão estabelecida': 'Conexão estabelecida',
    'Conexão estabelecida ': 'Conexão estabelecida',
    'Qualificação': 'Qualificação',
    'Apresentação': 'Apresentação',
    'Proposta': 'Proposta',
    'Proposta Enviada': 'Proposta',
    'Fechamento': 'Fechamento',
    'Fechamento ': 'Fechamento',
    'Venda Realizada': 'Venda Realizada',
    'Venda realizada': 'Venda Realizada',
    'venda realizada': 'Venda Realizada',
    'Pós-Venda': 'Pós-Venda',
    'Pós Vendas': 'Pós-Venda',
    'pós venda': 'Pós-Venda',
    'Perdido': 'Perdido'
  };

  return statusMap[status?.trim()] || 'Status Desconhecido';
}