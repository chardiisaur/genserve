import React from 'react';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

const workflowSteps = [
  { id: 'ws-1', icon: 'BuildingOffice2Icon', label: 'Register Client & Site' },
  { id: 'ws-2', icon: 'BoltIcon', label: 'Register Generator Asset' },
  { id: 'ws-3', icon: 'WrenchScrewdriverIcon', label: 'Create & Assign Service Job' },
  { id: 'ws-4', icon: 'ArchiveBoxIcon', label: 'Record Work & Parts Used' },
  { id: 'ws-5', icon: 'DocumentCurrencyDollarIcon', label: 'Close Job & Issue Invoice' },
];

export default function LoginBrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[480px] xl:w-[520px] flex-shrink-0 blob-primary text-white p-10">
      {/* Logo + wordmark */}
      <div className="flex items-center gap-3">
        <AppLogo size={36} />
        <div>
          <span className="font-700 text-lg text-white leading-tight block">GenServe GSMS</span>
          <span className="text-xs text-white/70">Indentrade Systems Corp.</span>
        </div>
      </div>

      {/* Center content */}
      <div>
        <h2 className="text-hero-xl text-white mb-3 leading-tight">
          Generator Service<br />Management System
        </h2>
        <p className="text-sm text-white/75 mb-8 leading-relaxed">
          Manage generator service operations end-to-end — from client registration and PMS scheduling to technician dispatch, parts inventory, and client billing.
        </p>

        {/* Workflow steps */}
        <div className="space-y-3">
          <p className="text-2xs uppercase tracking-widest text-white/50 font-600 mb-4">Operational Workflow</p>
          {workflowSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/15 text-white text-2xs font-700 flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex items-center gap-2.5">
                <Icon name={step.icon as Parameters<typeof Icon>[0]['name']} size={14} className="text-white/70" />
                <span className="text-sm text-white/85 font-500">{step.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-2xs text-white/40">
        © 2026 Indentrade Systems Corp. · Internal Use Only · v2.4.1
      </p>
    </div>
  );
}