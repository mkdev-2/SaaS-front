// src/components/kommo/KommoMetrics.tsx
import React from 'react';
import { Users, Tags, ShoppingBag } from 'lucide-react';
import { useKommoIntegration } from '../../hooks/useKommoIntegration';

interface LeadMetrics {
  daily: number;
  tags: {
    sellers: string[];
    personas: string[];
    sources: string[];
  };
  sales: {
    total: number;
    byProduct: Record<string, number>;
    byPayment: Record<string, number>;
    byPersona: Record<string, number>;
  };
}

export default function KommoMetrics() {
  const { isConnected, leads, isLoading } = useKommoIntegration();

  if (!isConnected || isLoading) {
    return null;
  }

  // Calcular leads por dia
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyLeads = leads.filter(lead => {
    const leadDate = new Date(lead.created_at * 1000);
    return leadDate >= today;
  }).length;

  // Agrupar leads por tags
  const tagMetrics = leads.reduce((acc, lead) => {
    // Adicionar vendedor às tags
    if (lead.responsible_user_id) {
      acc.sellers.add(lead.responsible_user_id.toString());
    }
    
    // Adicionar outras tags (persona, origem)
    lead.custom_fields_values?.forEach(field => {
      if (field.field_name === 'Persona') {
        acc.personas.add(field.values[0].value);
      }
      if (field.field_name === 'Origem') {
        acc.sources.add(field.values[0].value);
      }
    });
    
    return acc;
  }, {
    sellers: new Set<string>(),
    personas: new Set<string>(),
    sources: new Set<string>()
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Leads por dia */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-2xl font-bold">{dailyLeads}</span>
        </div>
        <h3 className="mt-4 text-gray-600 text-sm">Leads Hoje</h3>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Tags className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-right">
            <span className="block text-sm text-gray-500">Vendedores: {tagMetrics.sellers.size}</span>
            <span className="block text-sm text-gray-500">Personas: {tagMetrics.personas.size}</span>
            <span className="block text-sm text-gray-500">Origens: {tagMetrics.sources.size}</span>
          </div>
        </div>
        <h3 className="mt-4 text-gray-600 text-sm">Categorização</h3>
      </div>

      {/* Vendas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-green-100 rounded-lg">
            <ShoppingBag className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-2xl font-bold">
            ${leads.reduce((sum, lead) => sum + (lead.price || 0), 0).toLocaleString()}
          </span>
        </div>
        <h3 className="mt-4 text-gray-600 text-sm">Total em Vendas</h3>
      </div>
    </div>
  );
}
