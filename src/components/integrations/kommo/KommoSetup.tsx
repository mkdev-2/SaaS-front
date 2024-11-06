import React from 'react';
import KommoIntegration from './KommoIntegration';

export default function KommoSetup() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Setup Kommo Integration</h1>
        <p className="text-gray-500">Configure your Kommo CRM connection</p>
      </div>
      
      <div className="max-w-3xl">
        <KommoIntegration />
      </div>
    </div>
  );
}