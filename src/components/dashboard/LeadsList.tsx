import React from 'react';
import { LeadInteraction } from '../../types/dashboard';

interface LeadsListProps {
  leads: LeadInteraction[];
}

export default function LeadsList({ leads }: LeadsListProps) {
  return (
    <div className="overflow-hidden">
      <div className="flow-root">
        <ul role="list" className="-my-5 divide-y divide-gray-200">
          {leads.map((lead) => (
            <li key={`${lead.id}-${lead.tipo}`} className="py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lead.name}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{lead.tipo === 'novo' ? 'Novo Lead' : 'Interação'}</span>
                    <span>•</span>
                    <span>{lead.vendedor || 'Não atribuído'}</span>
                    <span>•</span>
                    <span>{lead.value}</span>
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