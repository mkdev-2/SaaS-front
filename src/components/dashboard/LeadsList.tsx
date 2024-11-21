import React from 'react';
import { Lead } from '../../types/dashboard';
import { Calendar, Tag, User } from 'lucide-react';
import { LEAD_STATUS_ORDER, STATUS_COLORS } from '../../utils/leadUtils';

interface LeadsListProps {
  leads: Lead[];
}

export default function LeadsList({ leads }: LeadsListProps) {
  const groupedLeads = React.useMemo(() => {
    // Initialize groups with all possible statuses
    const groups: Record<string, Lead[]> = {};
    LEAD_STATUS_ORDER.forEach(status => {
      groups[status] = [];
    });

    // Group leads by status
    leads.forEach(lead => {
      const status = lead.status || 'Status Desconhecido';
      if (groups[status]) {
        groups[status].push(lead);
      } else {
        groups['Status Desconhecido'].push(lead);
      }
    });

    // Remove empty status groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, statusLeads]) => statusLeads.length > 0)
    );
  }, [leads]);

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum lead encontrado no período selecionado
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Data inválida';
    }
  };

  // Sort status groups according to LEAD_STATUS_ORDER
  const sortedStatuses = Object.keys(groupedLeads).sort((a, b) => {
    return LEAD_STATUS_ORDER.indexOf(a) - LEAD_STATUS_ORDER.indexOf(b);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {sortedStatuses.map((status) => (
        <div 
          key={status}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">{status}</h3>
              <span className="text-xs font-medium text-gray-500">
                {groupedLeads[status].length}
              </span>
            </div>
          </div>

          <div className="p-2 space-y-2 min-h-[200px]">
            {groupedLeads[status].map((lead) => (
              <div
                key={lead.id}
                className="p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                style={{
                  backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#f9fafb',
                  color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] === '#32CD32' ? '#065F46' : 
                         STATUS_COLORS[status as keyof typeof STATUS_COLORS] === '#808080' ? '#1F2937' : '#111827'
                }}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium">
                      {lead.nome || `Lead #${lead.id}`}
                    </h4>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2 text-xs opacity-80">
                      <User className="h-3 w-3" />
                      <span>{lead.vendedor || 'Não atribuído'}</span>
                    </div>
                    
                    {lead.origem && lead.origem !== 'Origem não informada' && (
                      <div className="flex items-center space-x-2 text-xs opacity-80">
                        <Tag className="h-3 w-3" />
                        <span>{lead.origem}</span>
                      </div>
                    )}

                    {lead.valor && lead.valor !== 'R$ 0,00' && (
                      <p className="text-xs opacity-80">
                        Valor: {lead.valor}
                      </p>
                    )}

                    <div className="flex items-center space-x-2 text-xs opacity-70">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(lead.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}