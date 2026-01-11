"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { ref, push, set } from "firebase/database";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { InventoryItemType } from "@/types";

const ITEM_TYPES: { value: InventoryItemType; label: string }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'minerals', label: 'Minerals' },
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' }
];

const UNITS = ['kg', 'g', 'liter', 'ml', 'piece', 'bag', 'box', 'tank'];

export function AddInventoryDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    type: 'feed' as InventoryItemType,
    quantity: '',
    unit: 'kg',
    minimumThreshold: '',
    reorderQuantity: '',
    unitCost: '',
    supplier: '',
    expiryDate: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const inventoryRef = ref(db, 'farming/inventory');
      const newItemRef = push(inventoryRef);

      const newItem = {
        name: formData.name,
        type: formData.type,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        minimumThreshold: Number(formData.minimumThreshold),
        reorderQuantity: Number(formData.reorderQuantity),
        unitCost: Number(formData.unitCost),
        supplier: formData.supplier || '',
        lastRestocked: new Date().toISOString(),
        expiryDate: formData.expiryDate || null,
        notes: formData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await set(newItemRef, newItem);

      toast({
        title: "Inventory Item Added",
        description: `${formData.name} has been added to inventory.`,
      });

      setFormData({
        name: '',
        type: 'feed',
        quantity: '',
        unit: 'kg',
        minimumThreshold: '',
        reorderQuantity: '',
        unitCost: '',
        supplier: '',
        expiryDate: '',
        notes: ''
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add inventory item.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{children}</div>
      <DialogContent className="sm:max-w-lg animate-in fade-in slide-in-from-bottom-3 duration-300">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>
            Add a new item to your farming inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="col-span-3"
                  placeholder="e.g., Premium Shrimp Feed"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as InventoryItemType })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  className="col-span-2"
                  placeholder="0"
                />
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unitCost" className="text-right">Unit Cost (₹)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  required
                  className="col-span-3"
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minimumThreshold" className="text-right">Min. Stock</Label>
                <Input
                  id="minimumThreshold"
                  type="number"
                  step="0.01"
                  value={formData.minimumThreshold}
                  onChange={(e) => setFormData({ ...formData, minimumThreshold: e.target.value })}
                  required
                  className="col-span-3"
                  placeholder="Alert when below this"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reorderQuantity" className="text-right">Reorder Qty</Label>
                <Input
                  id="reorderQuantity"
                  type="number"
                  step="0.01"
                  value={formData.reorderQuantity}
                  onChange={(e) => setFormData({ ...formData, reorderQuantity: e.target.value })}
                  required
                  className="col-span-3"
                  placeholder="Order this amount when low"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier" className="text-right">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="col-span-3"
                  placeholder="Supplier name (optional)"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiryDate" className="text-right">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="col-span-3"
                  placeholder="Additional notes"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
