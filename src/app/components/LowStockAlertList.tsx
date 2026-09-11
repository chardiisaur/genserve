import React from 'react';
import Icon from '@/components/ui/AppIcon';
import StatusBadge from '@/components/ui/StatusBadge';

const lowStockParts = [
  {
    id: 'part-inv-007',
    partNo: 'CUM-OILF-6CTA',
    description: 'Oil Filter — Cummins 6CTA8.3',
    brand: 'Cummins',
    stockQty: 0,
    minStock: 5,
    unit: 'pcs',
    unitCost: 'PHP 850',
    reorderStatus: 'Out of Stock' as const,
    supplier: 'Cummins Philippines',
    storageLocation: 'Bin A-3',
  },
  {
    id: 'part-inv-012',
    partNo: 'MIT-BELT-S12R',
    description: 'Fan Belt Set — Mitsubishi S12R',
    brand: 'Mitsubishi',
    stockQty: 2,
    minStock: 4,
    unit: 'set',
    unitCost: 'PHP 3,200',
    reorderStatus: 'Low Stock' as const,
    supplier: 'Mitsubishi Heavy Industries PH',
    storageLocation: 'Bin C-7',
  },
  {
    id: 'part-inv-019',
    partNo: 'CUM-AIRF-KTA38',
    description: 'Air Filter — Cummins KTA38',
    brand: 'Cummins',
    stockQty: 1,
    minStock: 3,
    unit: 'pcs',
    unitCost: 'PHP 4,500',
    reorderStatus: 'Low Stock' as const,
    supplier: 'Cummins Philippines',
    storageLocation: 'Bin A-1',
  },
];

export default function LowStockAlertList() {
  return (
    <div className="bg-card border border-amber-200 rounded-xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-200 bg-amber-50/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-100">
            <Icon name="ExclamationTriangleIcon" size={14} className="text-amber-700" />
          </div>
          <div>
            <h3 className="text-sm font-600 text-amber-900">Parts Low Stock Alert</h3>
            <p className="text-2xs text-amber-700 mt-0.5">{lowStockParts.length} parts at or below minimum stock — reorder required</p>
          </div>
        </div>
        <button className="text-xs font-500 text-primary hover:underline flex items-center gap-1">
          Go to Inventory <Icon name="ArrowRightIcon" size={12} />
        </button>
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
            {lowStockParts.map((part) => (
              <tr key={part.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${part.reorderStatus === 'Out of Stock' ? 'bg-red-50/30' : 'bg-amber-50/20'}`}>
                <td className="px-5 py-3">
                  <span className="text-xs font-600 text-foreground tabular-nums">{part.partNo}</span>
                </td>
                <td className="px-5 py-3">
                  <p className="text-xs font-500 text-foreground">{part.description}</p>
                  <p className="text-2xs text-muted-foreground">{part.storageLocation}</p>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs text-foreground">{part.brand}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-700 tabular-nums ${part.stockQty === 0 ? 'text-red-700' : 'text-amber-700'}`}>
                    {part.stockQty} {part.unit}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs text-muted-foreground tabular-nums">{part.minStock} {part.unit}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs text-foreground tabular-nums">{part.unitCost}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs text-muted-foreground truncate max-w-[140px] block">{part.supplier}</span>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={part.reorderStatus} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}