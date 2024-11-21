import React from 'react';
import { Lead } from '../../types/dashboard';
import { getLeadStatus, formatLeadSummary } from '../../utils/leadUtils';
import { Calendar, MessageSquare } from 'lucide-react';

interface LeadsListProps {
  leads: Lead[];
}

export default function LeadsList({ leads }: LeadsListProps) {
  const groupedLeads = React.useMemo(() => {
    const groups: Record<string, Lead[]> = {};
    leads.forEach(lead => {
      const status = lead.status || 'Status Desconhecido';
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(lead);
    });
    return groups;
  }, [leads]);

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum lead encontrado no período selecionado
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {Object.entries(groupedLeads).map(([status, statusLeads]) => {
        const leadStatus = getLeadStatus(parseInt(status) || 0);
        
        return (
          <div 
            key={status}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">{leadStatus.name}</h3>
                <span className="text-xs font-medium text-gray-500">
                  {statusLeads.length}
                </span>
              </div>
            </div>

            <div className="p-2 space-y-2 min-h-[200px]">
              {statusLeads.map((lead) => {
                const details = formatLeadSummary(lead);
                
                return (
                  <div
                    key={lead.id}
                    className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    style={{
                      backgroundColor: details.status.color
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium" style={{
                          color: details.status.textColor
                        }}>
                          {lead.name}
                        </h4>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs text-gray-600">
                          Vendedor: {lead.vendedor || 'Não atribuído'}
                        </p>
                        {details.source && (
                          <p className="text-xs text-gray-600">
                            Origem: {details.source}
                          </p>
                        )}
                        <p className="text-xs text-gray-600">
                          Valor: {lead.value}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(lead.created_at)}</span>
                        </div>
                        {details.lastInteraction && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <MessageSquare className="h-3 w-3" />
                            <span>Última interação: {formatDate(details.lastInteraction.toISOString())}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}