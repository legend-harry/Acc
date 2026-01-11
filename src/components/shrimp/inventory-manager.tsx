"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useInventory } from '@/hooks/use-shrimp';
import { Loader2, Package2, Plus, Minus } from 'lucide-react';

const categories = [
  { id: 'feed', label: 'Feed' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'medication', label: 'Medication' },
  { id: 'consumable', label: 'Consumable' },
  { id: 'other', label: 'Other' },
] as const;

type CategoryId = typeof categories[number]['id'];

export function InventoryManager() {
  const { items, loading, addItem, updateItem } = useInventory();
  const [form, setForm] = useState({
    name: '',
    category: 'feed' as CategoryId,
    quantity: 0,
    unit: 'kg',
    reorderPoint: 0,
    location: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim() || form.quantity <= 0) return;
    setIsSaving(true);
    try {
      await addItem({
        name: form.name.trim(),
        category: form.category,
        quantity: form.quantity,
        unit: form.unit.trim() || 'unit',
        reorderPoint: form.reorderPoint || undefined,
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm({ name: '', category: 'feed', quantity: 0, unit: 'kg', reorderPoint: 0, location: '', notes: '' });
    } finally {
      setIsSaving(false);
    }
  };

  const adjustQuantity = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const nextQty = Math.max(0, (item.quantity || 0) + delta);
    await updateItem(id, { quantity: nextQty });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package2 className="h-5 w-5 text-blue-600" /> Farm Inventory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Item */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g., Grower Feed 35%"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v as CategoryId })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
              />
              <Input
                className="w-24"
                placeholder="unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reorder Point (optional)</Label>
            <Input
              type="number"
              value={form.reorderPoint}
              onChange={(e) => setForm({ ...form, reorderPoint: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Location (optional)</Label>
            <Input
              placeholder="e.g., Store Room A"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              placeholder="e.g., Expiry Nov 2026"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleAdd} disabled={isSaving || !form.name.trim() || form.quantity <= 0} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Item
          </Button>
        </div>

        <Separator />

        {/* Inventory List */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading inventory...
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No inventory items yet. Add feed or equipment to get started.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map(item => (
              <Card key={item.id} className="border-gray-200">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        <Badge variant="outline" className="capitalize">{item.category}</Badge>
                        {item.location && <Badge variant="secondary">{item.location}</Badge>}
                        <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {typeof item.reorderPoint === 'number' && item.reorderPoint > 0 && item.quantity <= item.reorderPoint && (
                      <Badge variant="destructive" className="text-xs">Reorder</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => adjustQuantity(item.id, -1)}><Minus className="h-4 w-4" /></Button>
                    <div className="text-lg font-semibold">{item.quantity} {item.unit}</div>
                    <Button variant="outline" size="icon" onClick={() => adjustQuantity(item.id, 1)}><Plus className="h-4 w-4" /></Button>
                  </div>
                  {item.notes && <p className="text-xs text-gray-600">{item.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
