import React from 'react';
import { RefreshCw } from 'lucide-react';
import { KommoLead } from '../../../lib/kommo/types';

interface KommoLeadsListProps {
  leads: KommoLead[];
  onRefresh: () => void;
}

export default function KommoLeadsList({ leads, onRefresh }: KommoLeadsListProps) {
  if (!leads.length) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <span className="text-sm font-medium text-gray-900">Recent Leads</span>
        <button
          onClick={onRefresh}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      
      <div className="mt-4 space-y-3">
        {leads.slice(0, 5).map((lead) => (
          <div
            key={lead.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium text-sm">{lead.name}</p>
              <p className="text-xs text-gray-500">
                Created: {new Date(lead.created_at * 1000).toLocaleDateString()}
              </p>
            </div>
            <span className="text-sm font-medium text-gray-900">
              ${lead.price.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}