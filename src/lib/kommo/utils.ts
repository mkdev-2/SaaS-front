export function calculateLeadValue(lead) {
    if (!lead) return 0;
    
    // First try to get value from valor field if it exists
    if (lead.valor) {
      const cleanValue = lead.valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
      const value = parseFloat(cleanValue);
      if (!isNaN(value)) {
        return value;
      }
    }
  
    // Then try catalog elements
    if (lead.catalog_elements?._embedded?.items) {
      const value = lead.catalog_elements._embedded.items.reduce((sum, item) => {
        const price = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity || 1, 10);
        return sum + (price * quantity);
      }, 0);
      if (value > 0) return value;
    }
  
    // Finally try price field
    if (lead.price) {
      const value = parseFloat(lead.price);
      if (!isNaN(value)) return value;
    }
  
    return 0;
  }
  
  export function isLeadSale(lead) {
    if (!lead || !lead.status_id) return false;
    return SALE_STATUSES.includes(lead.status_id);
  }
  
  export function getLeadStatus(lead) {
    if (!lead?.status_id) {
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
  
    const status = statusMap[lead.status_id];
    if (!status) {
      console.warn(`Unknown status ID: ${lead.status_id}`);
      return {
        id: lead.status_id,
        nome: 'Status Desconhecido',
        cor: '#808080'
      };
    }
  
    return {
      id: lead.status_id,
      nome: status.nome,
      cor: status.cor
    };
  }