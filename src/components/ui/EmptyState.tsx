import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={26} className="text-muted-foreground" />
      </div>
      <h3 className="text-sm font-600 text-foreground mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-5">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-500 px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors active:scale-95"
        >
          <Icon name="PlusIcon" size={14} />
          {action.label}
        </button>
      )}
    </div>
  );
}