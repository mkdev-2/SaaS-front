import React from 'react';
import { DollarSign, ShoppingBag, CreditCard, Users } from 'lucide-react';

interface PurchaseStatsProps {
  total: number;
  byProduct: [string, { count: number; value: number }][];
  byPayment: [string, { count: number; value: number }][];
  byPersona: [string, { count: number; value: number }][];
}

export default function PurchaseStats({ total, byProduct, byPayment, byPersona }: PurchaseStatsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Purchase Analytics</h2>
          <p className="text-sm text-gray-500">Total Revenue: ${total.toLocaleString()}</p>
        </div>
        <div className="p-2 bg-green-100 rounded-lg">
          <DollarSign className="h-5 w-5 text-green-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div>
          <div className="flex items-center mb-4">
            <ShoppingBag className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-900">By Product</h3>
          </div>
          <div className="space-y-3">
            {byProduct.map(([product, stats]) => (
              <div key={product} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{product}</span>
                  <span className="text-sm text-gray-500">{stats.count}x</span>
                </div>
                <div className="mt-1 text-sm text-green-600 font-medium">
                  ${stats.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <div className="flex items-center mb-4">
            <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-900">By Payment Method</h3>
          </div>
          <div className="space-y-3">
            {byPayment.map(([method, stats]) => (
              <div key={method} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{method}</span>
                  <span className="text-sm text-gray-500">{stats.count} transactions</span>
                </div>
                <div className="mt-1 text-sm text-green-600 font-medium">
                  ${stats.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personas */}
        <div>
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-900">By Persona</h3>
          </div>
          <div className="space-y-3">
            {byPersona.map(([persona, stats]) => (
              <div key={persona} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{persona}</span>
                  <span className="text-sm text-gray-500">{stats.count} purchases</span>
                </div>
                <div className="mt-1 text-sm text-green-600 font-medium">
                  ${stats.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}