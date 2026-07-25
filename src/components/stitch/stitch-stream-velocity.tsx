"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import { ShoppingCart, CreditCard, Cloud, Plane, Filter, MoveUp } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Transaction } from "@/types";

interface StitchStreamVelocityProps {
  transactions: Transaction[];
}

export function StitchStreamVelocity({ transactions }: StitchStreamVelocityProps) {
  const { currency } = useCurrency();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const feed = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [transactions]);

  // category velocity and attached charts removed per request

  const getIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('food') || c.includes('meal')) return <ShoppingCart className="w-5 h-5" />;
    if (c.includes('infra') || c.includes('cloud')) return <Cloud className="w-5 h-5" />;
    if (c.includes('travel')) return <Plane className="w-5 h-5" />;
    return <CreditCard className="w-5 h-5" />;
  };

  return (
    <div className="w-full">
      {/* Live Transaction Feed */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/10 flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold text-on-surface font-headline uppercase tracking-tight">Live Transaction Feed</h3>
          <div className="flex gap-2">
            <span className="px-2 py-1 rounded-md bg-surface-container-low text-[10px] font-medium text-on-surface-variant border border-outline-variant/20">Auto-scroll</span>
            <button className="text-outline hover:text-on-surface"><Filter className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto relative pr-2">
          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
          <div className="space-y-4 pt-2">
            {feed.map((t, i) => (
              <button key={t.id} onClick={() => { setSelectedTx(t); setDetailOpen(true); }} className={cn(
                "w-full text-left flex items-center justify-between p-3 rounded-xl transition-colors",
                i === 0 ? "bg-surface-container-low border border-outline-variant/20" : "hover:bg-surface-container-low/50"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    t.type === 'income' ? "bg-primary-container/10 text-primary-container" : "bg-surface-container-highest text-on-surface-variant"
                  )}>
                    {getIcon(t.category)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-outline">
                        {new Date(t.date).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">{t.category}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    t.type === 'income' ? "text-primary-container" : "text-secondary-container"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                  </p>
                  <p className="text-[10px] text-outline">{t.vendor || 'Personal'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-[80vw] p-0">
          <div className="p-4">
            <DialogTitle>Transaction</DialogTitle>
            <DialogDescription className="mb-4 text-sm">Details for the selected transaction.</DialogDescription>
            {selectedTx ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-on-surface">{selectedTx.title}</p>
                    <p className="text-sm text-on-surface-variant">{new Date(selectedTx.date).toLocaleString()}</p>
                  </div>
                  <div className="font-bold">{formatCurrency(selectedTx.amount, currency)}</div>
                </div>
                <div className="text-sm text-on-surface-variant">Category: {selectedTx.category}</div>
                <div className="text-sm text-on-surface-variant">Vendor: {selectedTx.vendor || 'Personal'}</div>
                <div className="text-sm text-on-surface-variant">Status: {selectedTx.status || 'completed'}</div>
                <div className="pt-3 border-t">{selectedTx.description}</div>
              </div>
            ) : (
              <div>No transaction selected</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
