
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
import { useProjects } from "@/hooks/use-database";
import { db } from "@/lib/firebase";
import { ref, push, set } from "firebase/database";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import type { Project } from "@/types";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

export function AddEmployeeDialog({
  children,
  onEmployeeAdded,
}: {
  children: React.ReactNode;
  onEmployeeAdded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { projects, loading: projectsLoading } = useProjects();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [employmentType, setEmploymentType] = useState<"permanent" | "temporary">("permanent");

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const wage = formData.get("wage") as string;
    const wageType = formData.get("wageType") as "hourly" | "daily" | "monthly";
    const overtimeRateMultiplier = formData.get("overtimeRateMultiplier") as string;
    const notes = formData.get("notes") as string;
    const employmentEndDate = formData.get("employmentEndDate") as string;

    if (!name || !wage || !wageType || selectedProjects.length === 0) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all required fields and assign at least one project.",
        });
        setIsLoading(false);
        return;
    }
    
    const newEmployee = {
        name,
        wage: Number(wage),
        wageType,
        projectIds: selectedProjects,
        overtimeRateMultiplier: Number(overtimeRateMultiplier) || 1.5,
        notes,
        employmentType,
        employmentEndDate: employmentType === 'temporary' ? new Date(employmentEndDate).toISOString() : '',
    };
    
    try {
        const employeesRef = ref(db, 'employees');
        const newEmployeeRef = push(employeesRef);
        await set(newEmployeeRef, newEmployee);
        
        setIsLoading(false);
        setOpen(false);
        (event.target as HTMLFormElement).reset();
        setSelectedProjects([]);
        setEmploymentType("permanent");
        
        toast({
            title: "Employee Added",
            description: `Successfully added ${name}.`,
        });
        onEmployeeAdded?.();

    } catch (error) {
        console.error("Failed to add employee:", error);
        setIsLoading(false);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save the new employee.",
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{children}</div>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Enter the details for the new team member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[70vh] p-1">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Full Name *
                </Label>
                <Input id="name" name="name" required className="col-span-3" />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type *</Label>
                <RadioGroup
                    value={employmentType}
                    onValueChange={(value) => setEmploymentType(value as "permanent" | "temporary")}
                    className="col-span-3 flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="permanent" id="r-permanent" />
                        <Label htmlFor="r-permanent">Permanent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="temporary" id="r-temporary" />
                        <Label htmlFor="r-temporary">Temporary</Label>
                    </div>
                </RadioGroup>
              </div>
              
              {employmentType === 'temporary' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="employmentEndDate" className="text-right">End Date *</Label>
                      <Input
                          id="employmentEndDate"
                          name="employmentEndDate"
                          type="date"
                          required
                          className="col-span-3"
                      />
                  </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="wage" className="text-right">
                  Wage/Salary *
                </Label>
                <Input id="wage" name="wage" type="number" step="0.01" required className="col-span-3" />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="wageType" className="text-right">
                  Wage Type *
                </Label>
                <Select name="wageType" required defaultValue="daily">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select wage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="overtimeRateMultiplier" className="text-right">
                  OT Rate (x)
                </Label>
                <Input id="overtimeRateMultiplier" name="overtimeRateMultiplier" type="number" step="0.1" defaultValue="1.5" className="col-span-3" />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Projects *</Label>
                  <div className="col-span-3 space-y-2">
                    {projectsLoading ? (
                        <p className="text-sm text-muted-foreground">Loading projects...</p>
                    ) : (
                        projects.map((project: Project) => (
                            <div key={project.id} className="flex items-center gap-2">
                                <Checkbox
                                    id={`proj-${project.id}`}
                                    checked={selectedProjects.includes(project.id)}
                                    onCheckedChange={() => handleProjectToggle(project.id)}
                                />
                                <Label htmlFor={`proj-${project.id}`} className="font-normal cursor-pointer">{project.name}</Label>
                            </div>
                        ))
                    )}
                  </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea id="notes" name="notes" className="col-span-3" />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || projectsLoading}>
              {isLoading ? "Saving..." : "Save Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
