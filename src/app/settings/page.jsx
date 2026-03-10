'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSettings } from '@/hooks/useSettings';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ModelConfig } from '@/components/settings/ModelConfig';
import { MemorySettings } from '@/components/settings/MemorySettings';
import { ClusterManager } from '@/components/settings/ClusterManager';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { CronManager } from '@/components/settings/CronManager';
import { ModuleToggles } from '@/components/settings/ModuleToggles';
import { DocumentSettings } from '@/components/settings/DocumentSettings';
import { ExportSettings } from '@/components/settings/ExportSettings';
import { McpServerManager } from '@/components/settings/McpServerManager';
import { OllamaConnection } from '@/components/settings/OllamaConnection';
import { OllamaModelManager } from '@/components/settings/OllamaModelManager';
import { DataManagement } from '@/components/settings/DataManagement';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { ComfyUISettings } from '@/components/settings/ComfyUISettings';
import { BackendSettings } from '@/components/settings/BackendSettings';
import { SystemDashboard } from '@/components/shared/SystemDashboard';

const TABS = [
  { value: 'backend', label: 'Backend' },
  { value: 'models', label: 'Models' },
  { value: 'memory', label: 'Memory' },
  { value: 'clusters', label: 'Clusters' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'schedules', label: 'Schedules' },
  { value: 'modules', label: 'Modules' },
  { value: 'documents', label: 'Documents' },
  { value: 'exports', label: 'Exports' },
  { value: 'mcp', label: 'MCP' },
  { value: 'comfyui', label: 'ComfyUI' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'data', label: 'Data' },
  { value: 'appearance', label: 'Appearance' },
];

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();

  if (loading) return <AppShell title="Settings"><LoadingSpinner /></AppShell>;

  return (
    <AppShell title="Settings">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <Tabs defaultValue="models" className="flex flex-col lg:flex-row gap-6">
          <ScrollArea className="w-full lg:w-48 shrink-0">
            <TabsList className="flex lg:flex-col lg:h-auto lg:bg-transparent lg:space-y-1 overflow-x-auto lg:overflow-visible">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="lg:w-full lg:justify-start">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
          <div className="flex-1 min-w-0">
            <TabsContent value="backend"><BackendSettings settings={settings} onSave={updateSettings} /></TabsContent>
            <TabsContent value="models"><ModelConfig settings={settings} onSave={updateSettings} /></TabsContent>
            <TabsContent value="memory"><MemorySettings settings={settings} onSave={updateSettings} /></TabsContent>
            <TabsContent value="clusters"><ClusterManager /></TabsContent>
            <TabsContent value="notifications"><NotificationSettings settings={settings} onSave={updateSettings} /></TabsContent>
            <TabsContent value="schedules"><CronManager /></TabsContent>
            <TabsContent value="modules"><ModuleToggles settings={settings} onSave={updateSettings} /></TabsContent>
            <TabsContent value="documents"><DocumentSettings settings={settings} onSave={updateSettings} /></TabsContent>
            <TabsContent value="exports"><ExportSettings settings={settings} onSave={updateSettings} /></TabsContent>
            <TabsContent value="mcp"><McpServerManager /></TabsContent>
            <TabsContent value="comfyui"><ComfyUISettings settings={settings} onSave={updateSettings} /></TabsContent>
            <TabsContent value="ollama">
                {(settings.cortex_backend || 'ollama') === 'ollama' ? (
                  <>
                    <OllamaConnection settings={settings} onSave={updateSettings} />
                    <div className="mt-6">
                      <OllamaModelManager />
                    </div>
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">System Dashboard</h3>
                      <SystemDashboard compact={false} />
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Ollama</h3>
                    <p className="text-sm text-muted-foreground">
                      Ollama model management is not available when using the llama.cpp backend.
                      Model management is handled externally with llama-server.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Switch to the Ollama backend in the Backend tab to access model management.
                    </p>
                  </div>
                )}
              </TabsContent>
            <TabsContent value="data"><DataManagement /></TabsContent>
            <TabsContent value="appearance"><AppearanceSettings /></TabsContent>
          </div>
        </Tabs>
      </div>
    </AppShell>
  );
}
