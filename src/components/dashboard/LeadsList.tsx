import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { STATUS_NAMES, STATUS_COLORS, PIPELINE_STATUS } from '../../lib/kommo/constants';

interface Lead {
  id: number;
  name: string;
  status: string;
  status_id: number;
  statusColor: string;
  tipo: string;
  vendedor: string;
  value: string;
  created_at: string;
}

interface LeadsListProps {
  leads: Lead[];
}

const DEFAULT_STATUS = {
  color: '#F3F4F6',
  textColor: '#4B5563'
};

export default function LeadsList({ leads }: LeadsListProps) {
  const groupedLeads = React.useMemo(() => {
    const groups: Record<string, Lead[]> = {};
    
    // Initialize all status groups
    Object.values(STATUS_NAMES).forEach(status => {
      groups[status] = [];
    });
    groups['Não Categorizado'] = [];

    // Group leads by status
    leads.forEach(lead => {
      const statusName = STATUS_NAMES[lead.status_id] || 'Não Categorizado';
      groups[statusName].push(lead);
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, leads]) => leads.length > 0)
    );
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
            {statusLeads.map((lead) => {
              const statusStyle = STATUS_COLORS[lead.status_id] || DEFAULT_STATUS;
              
              return (
                <div
                  key={lead.id}
                  className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  style={{
                    backgroundColor: statusStyle.color
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium" style={{
                        color: statusStyle.textColor
                      }}>
                        {lead.name}
                      </h4>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs text-gray-600">
                        Vendedor: {lead.vendedor || 'Não atribuído'}
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
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}