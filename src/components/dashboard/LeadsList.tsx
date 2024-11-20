import React from 'react';

interface Lead {
  id: number;
  name: string;
  status: string;
  statusColor: string;
  tipo: string;
  vendedor: string;
  value: string;
  created_at: string;
}

interface LeadsListProps {
  leads: Lead[];
}

export default function LeadsList({ leads }: LeadsListProps) {
  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum lead encontrado no período selecionado
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="flow-root">
        <ul role="list" className="-my-5 divide-y divide-gray-200">
          {leads.map((lead) => (
            <li key={lead.id} className="py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lead.name}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{lead.vendedor || 'Não atribuído'}</span>
                    <span>•</span>
                    <span>{lead.value}</span>
                    <span>•</span>
                    <span>{new Date(lead.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <div>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${lead.statusColor}40`,
                      color: lead.statusColor
                    }}
                  >
                    {lead.status}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}