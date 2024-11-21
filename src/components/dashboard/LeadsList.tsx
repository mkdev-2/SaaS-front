import React from 'react';
import { Lead } from '../../types/dashboard';
import { Calendar, Tag, User } from 'lucide-react';

interface LeadsListProps {
  leads: Lead[];
}

export default function LeadsList({ leads }: LeadsListProps) {
  const groupedLeads = React.useMemo(() => {
    const groups: Record<string, Lead[]> = {};
    leads.forEach(lead => {
      if (!groups[lead.status]) {
        groups[lead.status] = [];
      }
      groups[lead.status].push(lead);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {Object.entries(groupedLeads).map(([status, statusLeads]) => (
        <div 
          key={status}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">{status}</h3>
              <span className="text-xs font-medium text-gray-500">
                {statusLeads.length}
              </span>
            </div>
          </div>

          <div className="p-2 space-y-2 min-h-[200px]">
            {statusLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                style={{
                  backgroundColor: lead.statusCor || '#f9fafb'
                }}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-900">
                      {lead.nome}
                    </h4>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <User className="h-3 w-3" />
                      <span>{lead.vendedor || 'Não atribuído'}</span>
                    </div>
                    
                    {lead.origem && lead.origem !== 'Origem não informada' && (
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Tag className="h-3 w-3" />
                        <span>{lead.origem}</span>
                      </div>
                    )}

                    <p className="text-xs text-gray-600">
                      Valor: {lead.valor}
                    </p>

                    <div className="flex items-center space-x-2 text-xs text-gray-500">
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