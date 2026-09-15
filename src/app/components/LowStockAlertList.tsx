'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import StatusBadge from '@/components/ui/StatusBadge';

interface LowStockPart {
  partId: string;
  partNo: string;
  partDescription: string;
  brand: string;
  stockQty: number;
  minimumStock: number;
  unit: string;
  unitCost: number;
  supplier: string;
  storageLocation: string;
  reorderStatus: string;
}

interface LowStockAlertListProps {
  parts: LowStockPart[];
}

function formatCurrency(amount: number): string {
  return 'PHP ' + amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function LowStockAlertList({ parts }: LowStockAlertListProps) {
  if (parts.length === 0) {
    return (
      <div className="bg-card border border-emerald-200 rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50/40">
          <div className="p-1.5 rounded-md bg-emerald-100">
            <Icon name="CheckCircleIcon" size={14} className="text-emerald-700" />
          </div>
          <div>
            <h3 className="text-sm font-600 text-emerald-900">Parts Stock Levels OK</h3>
            <p className="text-2xs text-emerald-700 mt-0.5">All parts are above minimum stock levels</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-amber-200 rounded-xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-200 bg-amber-50/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-100">
            <Icon name="ExclamationTriangleIcon" size={14} className="text-amber-700" />
          </div>
          <div>
            <h3 className="text-sm font-600 text-amber-900">Parts Low Stock Alert</h3>
            <p className="text-2xs text-amber-700 mt-0.5">
              {parts.length} part{parts.length !== 1 ? 's' : ''} at or below minimum stock — reorder required
            </p>
          </div>
        </div>
        <Link href="/parts-inventory" className="text-xs font-500 text-primary hover:underline flex items-center gap-1">
          Go to Inventory <Icon name="ArrowRightIcon" size={12} />
        </Link>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left px-5 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Part No.</th>
              <th className="text-left px-5 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Description</th>
              <th className="text-left px-5 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Brand</th>
              <th className="text-left px-5 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Stock Qty</th>
              <th className="text-left px-5 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Min. Stock</th>
              <th className="text-left px-5 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Unit Cost</th>
              <th className="text-left px-5 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Supplier</th>
              <th className="text-left px-5 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => {
              const isOutOfStock = part.stockQty <= 0;
              const statusLabel = isOutOfStock ? 'Out of Stock' : 'Low Stock';
              return (
                <tr
                  key={part.partId}
                  className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isOutOfStock ? 'bg-red-50/30' : 'bg-amber-50/20'}`}
                >
                  <td className="px-5 py-3">
                    <span className="text-xs font-600 text-foreground tabular-nums">{part.partNo}</span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs font-500 text-foreground">{part.partDescription}</p>
                    <p className="text-2xs text-muted-foreground">{part.storageLocation}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-foreground">{part.brand || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-700 tabular-nums ${isOutOfStock ? 'text-red-700' : 'text-amber-700'}`}>
                      {part.stockQty} {part.unit}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-muted-foreground tabular-nums">{part.minimumStock} {part.unit}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-foreground tabular-nums">{formatCurrency(part.unitCost)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-muted-foreground truncate max-w-[140px] block">{part.supplier || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={statusLabel as Parameters<typeof StatusBadge>[0]['status']} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}