import React from 'react';
import { Lead } from '../../types/dashboard';
import { getLeadStatus } from '../../utils/leadUtils';

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
              {statusLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  style={{
                    backgroundColor: leadStatus.color
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium" style={{
                        color: leadStatus.textColor
                      }}>
                        {lead.name}
                      </h4>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs text-gray-600">
                        Vendedor: {lead.vendedor}
                      </p>
                      <p className="text-xs text-gray-600">
                        Valor: {lead.value}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(lead.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}