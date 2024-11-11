import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import SalesOverview from './dashboard/pages/SalesOverview';
import TeamPerformance from './dashboard/pages/TeamPerformance';
import MarketingAnalytics from './dashboard/pages/MarketingAnalytics';
import ServiceQuality from './dashboard/pages/ServiceQuality';

export default function Dashboard() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <div className="border-b px-6">
        <TabsList className="flex space-x-8">
          <TabsTrigger value="overview" className="pb-4 text-sm font-medium">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="team" className="pb-4 text-sm font-medium">
            Performance da Equipe
          </TabsTrigger>
          <TabsTrigger value="marketing" className="pb-4 text-sm font-medium">
            Analytics de Marketing
          </TabsTrigger>
          <TabsTrigger value="quality" className="pb-4 text-sm font-medium">
            Qualidade do Atendimento
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview">
        <SalesOverview />
      </TabsContent>

      <TabsContent value="team">
        <TeamPerformance />
      </TabsContent>

      <TabsContent value="marketing">
        <MarketingAnalytics />
      </TabsContent>

      <TabsContent value="quality">
        <ServiceQuality />
      </TabsContent>
    </Tabs>
  );
}