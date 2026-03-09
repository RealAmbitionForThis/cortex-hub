'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MODULES } from '@/lib/constants';
import { DollarSign, Heart, Car, Users, CheckSquare, FileText } from 'lucide-react';

const MODULE_CONFIG = [
  { key: MODULES.MONEY, label: 'Money', icon: DollarSign },
  { key: MODULES.HEALTH, label: 'Health', icon: Heart },
  { key: MODULES.VEHICLE, label: 'Vehicle', icon: Car },
  { key: MODULES.CONTACTS, label: 'Contacts', icon: Users },
  { key: MODULES.TASKS, label: 'Tasks', icon: CheckSquare },
  { key: MODULES.DOCS, label: 'Documents', icon: FileText },
];

export function ModuleToggles({ settings, onSave }) {
  function handleToggle(key, enabled) {
    onSave({ [`module_${key}_enabled`]: enabled });
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Module Settings</h3>
      <div className="space-y-4">
        {MODULE_CONFIG.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base">{label}</Label>
            </div>
            <Switch
              checked={settings[`module_${key}_enabled`] !== false}
              onCheckedChange={(v) => handleToggle(key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
