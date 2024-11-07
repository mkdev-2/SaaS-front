import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Box, Zap, RefreshCw, AlertCircle, Tags, ShoppingBag, DollarSign } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useKommoIntegration } from '../hooks/useKommoIntegration';
import DailyLeadsChart from './dashboard/DailyLeadsChart';
import VendorStats from './dashboard/VendorStats';
import PersonaStats from './dashboard/PersonaStats';
import PurchaseStats from './dashboard/PurchaseStats';
import PeriodSelector from './dashboard/PeriodSelector';

interface KommoMetrics {
  dailyLeads: {
    count: number;
    value: number;
  };
  tags: {
    sellers: Map<string, number>;
    personas: Map<string, number>;
    sources: Map<string, number>;
  };
  sales: {
    total: number;
    byProduct: Map<string, { count: number; value: number }>;
    byPayment: Map<string, { count: number; value: number }>;
    byPersona: Map<string, { count: number; value: number }>;
  };
}

export default function Dashboard() {
  const { data, loading, error, refresh } = useDashboardData();
  const { isConnected: isKommoConnected, leads: kommoLeads, error: kommoError } = useKommoIntegration();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Calculate Kommo metrics
  const kommoMetrics = React.useMemo((): KommoMetrics => {
    if (!kommoLeads?.length) {
      return {
        dailyLeads: { count: 0, value: 0 },
        tags: {
          sellers: new Map(),
          personas: new Map(),
          sources: new Map()
        },
        sales: {
          total: 0,
          byProduct: new Map(),
          byPayment: new Map(),
          byPersona: new Map()
        }
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return kommoLeads.reduce((metrics, lead) => {
      const leadDate = new Date(lead.created_at * 1000);
      
      // Count daily leads
      if (leadDate >= today) {
        metrics.dailyLeads.count++;
        metrics.dailyLeads.value += lead.price || 0;
      }

      // Process tags and custom fields
      lead.custom_fields_values?.forEach(field => {
        const value = field.values[0]?.value;
        if (!value) return;

        switch (field.field_name.toLowerCase()) {
          case 'vendedor':
          case 'seller':
            metrics.tags.sellers.set(
              value,
              (metrics.tags.sellers.get(value) || 0) + 1
            );
            break;

          case 'persona':
            metrics.tags.personas.set(
              value,
              (metrics.tags.personas.get(value) || 0) + 1
            );
            if (lead.price > 0) {
              const current = metrics.sales.byPersona.get(value) || { count: 0, value: 0 };
              metrics.sales.byPersona.set(value, {
                count: current.count + 1,
                value: current.value + lead.price
              });
            }
            break;

          case 'origem':
          case 'source':
            metrics.tags.sources.set(
              value,
              (metrics.tags.sources.get(value) || 0) + 1
            );
            break;

          case 'produto':
          case 'product':
            if (lead.price > 0) {
              const current = metrics.sales.byProduct.get(value) || { count: 0, value: 0 };
              metrics.sales.byProduct.set(value, {
                count: current.count + 1,
                value: current.value + lead.price
              });
            }
            break;

          case 'forma_pagamento':
          case 'payment_method':
            if (lead.price > 0) {
              const current = metrics.sales.byPayment.get(value) || { count: 0, value: 0 };
              metrics.sales.byPayment.set(value, {
                count: current.count + 1,
                value: current.value + lead.price
              });
            }
            break;
        }
      });

      // Add to total sales
      if (lead.price > 0) {
        metrics.sales.total += lead.price;
      }

      return metrics;
    }, {
      dailyLeads: { count: 0, value: 0 },
      tags: {
        sellers: new Map(),
        personas: new Map(),
        sources: new Map()
      },
      sales: {
        total: 0,
        byProduct: new Map(),
        byPayment: new Map(),
        byPersona: new Map()
      }
    });
  }, [kommoLeads]);

  const stats = [
    {
      title: "Today's Leads",
      value: kommoMetrics.dailyLeads.count,
      previousValue: 0,
      icon: Users
    },
    {
      title: "Today's Lead Value",
      value: kommoMetrics.dailyLeads.value,
      previousValue: 0,
      icon: DollarSign,
      format: (value: number) => `$${value.toLocaleString()}`
    },
    {
      title: "Active Tags",
      value: kommoMetrics.tags.personas.size + kommoMetrics.tags.sources.size,
      previousValue: 0,
      icon: Tags
    },
    {
      title: "Total Sales",
      value: kommoMetrics.sales.total,
      previousValue: 0,
      icon: ShoppingBag,
      format: (value: number) => `$${value.toLocaleString()}`
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-500">Real-time sales and performance metrics</p>
        </div>
        <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
      </div>

      {/* Error alerts */}
      {(error || kommoError) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Integration Status
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              {error || kommoError}
            </p>
          </div>
          <button
            onClick={refresh}
            className="ml-3 bg-yellow-100 p-2 rounded-full text-yellow-600 hover:bg-yellow-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.format ? stat.format(stat.value) : stat.value.toString()}
              change={`${((stat.value - (stat.previousValue || 0)) / (stat.previousValue || 1) * 100).toFixed(1)}%`}
              icon={stat.icon}
            />
          ))
        )}
      </div>

      {/* Charts and Analytics */}
      {isKommoConnected && (
        <>
          {/* Daily Leads Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Trends</h2>
            <DailyLeadsChart data={kommoLeads} period={selectedPeriod} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Performance */}
            <VendorStats data={Array.from(kommoMetrics.tags.sellers.entries())} />

            {/* Persona Distribution */}
            <PersonaStats data={Array.from(kommoMetrics.tags.personas.entries())} />
          </div>

          {/* Purchase Analytics */}
          <PurchaseStats
            total={kommoMetrics.sales.total}
            byProduct={Array.from(kommoMetrics.sales.byProduct.entries())}
            byPayment={Array.from(kommoMetrics.sales.byPayment.entries())}
            byPersona={Array.from(kommoMetrics.sales.byPersona.entries())}
          />
        </>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
}

function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  const isPositive = !change.startsWith('-');
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
        <span className={`flex items-center text-sm ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {change}
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 ml-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 ml-1" />
          )}
        </span>
      </div>
      <h3 className="text-2xl font-bold mt-4">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </div>
  );
}