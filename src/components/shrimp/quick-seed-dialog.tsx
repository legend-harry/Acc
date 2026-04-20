"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePonds } from '@/hooks/use-shrimp';
import { ref, push, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useUser } from '@/context/user-context';

interface QuickSeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSeeded?: (pondId: string) => void;
}

const POND_TEMPLATES = [
  {
    id: 'starter',
    icon: 'seedling',
    label: 'Starter Pond',
    description: '0.5 ha intensive, 30-day operation',
    color: 'border-emerald-200 bg-emerald-50',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    data: {
      name: 'Starter Pond A1',
      area: 0.5,
      length: 100,
      width: 50,
      depth: 1.5,
      shrimpType: 'white' as const,
      farmingType: 'intensive' as const,
      targetDensity: 100,
      seedAmount: 50000,
      expectedCount: 42500,
      waterSource: 'well',
      status: 'active' as const,
      currentStage: 'operation' as const,
      cycleDay: 30,
      daysBack: 30,
    },
  },
  {
    id: 'production',
    icon: 'factory',
    label: 'Production Pond',
    description: '1 ha intensive, 60-day operation',
    color: 'border-blue-200 bg-blue-50',
    badgeColor: 'bg-blue-100 text-blue-800',
    data: {
      name: 'Main Production Pond',
      area: 1.0,
      length: 200,
      width: 50,
      depth: 1.8,
      shrimpType: 'white' as const,
      farmingType: 'intensive' as const,
      targetDensity: 120,
      seedAmount: 120000,
      expectedCount: 102000,
      waterSource: 'seawater',
      status: 'active' as const,
      currentStage: 'operation' as const,
      cycleDay: 60,
      daysBack: 60,
    },
  },
  {
    id: 'harvest-ready',
    icon: 'target',
    label: 'Near Harvest',
    description: '0.8 ha semi-intensive, 100-day cycle',
    color: 'border-amber-200 bg-amber-50',
    badgeColor: 'bg-amber-100 text-amber-800',
    data: {
      name: 'Harvest Pond B2',
      area: 0.8,
      length: 160,
      width: 50,
      depth: 1.6,
      shrimpType: 'tiger' as const,
      farmingType: 'semi-intensive' as const,
      targetDensity: 50,
      seedAmount: 40000,
      expectedCount: 34000,
      waterSource: 'pond',
      status: 'harvesting' as const,
      currentStage: 'harvest' as const,
      cycleDay: 100,
      daysBack: 100,
    },
  },
  {
    id: 'new-setup',
    icon: 'hammer',
    label: 'New Setup',
    description: '1.2 ha, preparing phase — just getting started',
    color: 'border-purple-200 bg-purple-50',
    badgeColor: 'bg-purple-100 text-purple-800',
    data: {
      name: 'New Pond C1',
      area: 1.2,
      length: 240,
      width: 50,
      depth: 2.0,
      shrimpType: 'white' as const,
      farmingType: 'intensive' as const,
      targetDensity: 100,
      seedAmount: 120000,
      expectedCount: 102000,
      waterSource: 'well',
      status: 'preparing' as const,
      currentStage: 'preparation' as const,
      cycleDay: 0,
      daysBack: 0,
    },
  },
];

export function QuickSeedDialog({ open, onOpenChange, onSeeded }: QuickSeedDialogProps) {
  const { toast } = useToast();
  const { addPond } = usePonds();
  const { selectedProfile } = useUser();
  const [seeding, setSeeding] = useState<string | null>(null);
  const [seeded, setSeeded] = useState<string[]>([]);

  const handleSeed = async (template: typeof POND_TEMPLATES[0]) => {
    if (!selectedProfile) {
      toast({ variant: 'destructive', title: 'No profile selected', description: 'Please select a profile first.' });
      return;
    }
    setSeeding(template.id);
    try {
      const { daysBack, ...pondData } = template.data;

      // Compute stockingDate by going back daysBack days
      const stockingDate = new Date();
      stockingDate.setDate(stockingDate.getDate() - daysBack);

      const newId = await addPond({
        ...pondData,
        stockingDate: stockingDate.toISOString(),
        linkedProjectId: null,
        currentPhase: pondData.currentStage,
      } as any);

      setSeeded(prev => [...prev, template.id]);
      toast({ title: `${template.data.name} created`, description: `Day ${pondData.cycleDay} of culture — seeded ${daysBack} days ago.` });
      if (newId && onSeeded) onSeeded(newId);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Seed failed', description: 'Could not create pond. Try again.' });
    } finally {
      setSeeding(null);
    }
  };

  const handleSeedAll = async () => {
    for (const template of POND_TEMPLATES) {
      if (!seeded.includes(template.id)) {
        await handleSeed(template);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Quick Seed Farm Data
          </DialogTitle>
          <DialogDescription>
            Instantly create sample ponds with realistic cycle data. Perfect for exploring all features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {POND_TEMPLATES.map(template => (
            <Card key={template.id} className={`border ${template.color} transition-all`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{template.label}</p>
                        {seeded.includes(template.id) && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Added
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{template.description}</p>
                      <Badge className={`text-xs mt-1 ${template.badgeColor}`}>
                        {template.data.name}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={seeded.includes(template.id) ? 'outline' : 'default'}
                    disabled={seeding === template.id || seeded.includes(template.id)}
                    onClick={() => handleSeed(template)}
                    className="flex-shrink-0"
                  >
                    {seeding === template.id ? (
                      <><Loader2 className="h-3 w-3 animate-spin mr-1" />Adding</>
                    ) : seeded.includes(template.id) ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" />Done</>
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            disabled={seeding !== null || seeded.length === POND_TEMPLATES.length}
            onClick={handleSeedAll}
          >
            <Zap className="h-4 w-4 mr-1.5" />
            {seeded.length === POND_TEMPLATES.length ? 'All Added!' : 'Add All Ponds'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
