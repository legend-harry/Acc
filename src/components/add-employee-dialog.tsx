
"use client";

import { useState } from "react";
import { createClient } from '@/lib/supabase/client';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import type { Project } from "@/types";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useClient } from "@/context/client-context";
import { useUser } from "@/context/user-context";

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
  const { clientId } = useClient();
  const { selectedProfile } = useUser();
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
        const supabase = createClient();
        // Full insert (requires migration to add extended columns)
        const fullRecord = {
            client_id: clientId,
            profile_id: selectedProfile || '',
            name: newEmployee.name,
            role: newEmployee.name,
            salary: newEmployee.wage,
            wage: newEmployee.wage,
            wage_type: newEmployee.wageType,
            project_ids: newEmployee.projectIds,
            overtime_rate_multiplier: newEmployee.overtimeRateMultiplier,
            notes: newEmployee.notes,
            employment_type: newEmployee.employmentType,
            employment_end_date: newEmployee.employmentEndDate || null,
        };
        // Core-only insert (base schema: name, role, salary)
        const coreRecord = {
            client_id: clientId,
            profile_id: selectedProfile || '',
            name: newEmployee.name,
            role: newEmployee.name,
            salary: newEmployee.wage,
        };

        const { error } = await supabase.from('employees').insert(fullRecord);
        if (error) {
            console.warn("Full employee insert failed, trying core-only:", error.message);
            const { error: coreError } = await supabase.from('employees').insert(coreRecord);
            if (coreError) throw coreError;
        }
        
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
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-surface rounded-3xl border-none shadow-2xl [&>button:last-child]:hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
          {/* Header Area */}
          <div className="flex items-start gap-4 p-8 pb-6 bg-[#f0f2f5]">
            <DialogClose asChild>
              <button type="button" className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-outline-variant/10 hover:bg-surface-container transition-colors shrink-0">
                <span className="material-symbols-outlined text-[20px] text-on-surface">arrow_back</span>
              </button>
            </DialogClose>
            <div className="flex flex-col">
              <DialogTitle className="text-2xl font-bold text-on-surface font-headline tracking-tight">Add New Employee</DialogTitle>
              <DialogDescription className="text-sm font-medium text-on-surface-variant mt-1">
                Onboard a new team member to your ledger.
              </DialogDescription>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.04)] -mt-4 relative z-10 p-8">
            <div className="flex flex-col gap-8 pb-4">
              
              {/* SECTION: IDENTITY & ROLE */}
              <div className="flex flex-col gap-5">
                <h3 className="text-xs font-bold text-primary tracking-widest uppercase mb-1">
                  Identity & Role
                </h3>
                
                {/* Full Name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-sm font-bold text-on-surface">
                    Full Name
                  </Label>
                  <Input 
                    id="name" 
                    name="name" 
                    required 
                    placeholder="e.g. Johnathan Smith"
                    className="bg-[#f8f9fc] border-none shadow-none h-12 rounded-xl text-base px-4 placeholder:text-outline-variant placeholder:font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* Employment Type */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-bold text-on-surface">Employment Type</Label>
                    <div className="flex bg-[#f8f9fc] rounded-xl p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setEmploymentType("permanent")}
                          className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all ${employmentType === "permanent" ? "bg-white border-2 border-primary text-primary shadow-sm" : "text-outline hover:text-on-surface"}`}
                        >
                          Permanent
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmploymentType("temporary")}
                          className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all ${employmentType === "temporary" ? "bg-white border-2 border-primary text-primary shadow-sm" : "text-outline hover:text-on-surface"}`}
                        >
                          Temporary
                        </button>
                    </div>
                  </div>

                  {/* Assigned Projects */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-bold text-on-surface pt-1">Assigned Projects</Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {projectsLoading ? (
                        <p className="text-sm text-outline-variant">Loading...</p>
                      ) : (
                        <>
                          {projects.slice(0, 3).map((project: Project) => (
                            <button
                                type="button"
                                key={project.id}
                                onClick={() => handleProjectToggle(project.id)}
                                className={`flex items-center gap-2 h-9 px-3 rounded-full text-sm font-semibold transition-colors ${
                                  selectedProjects.includes(project.id) 
                                    ? "bg-primary text-white" 
                                    : "bg-[#f0f2f5] text-on-surface hover:bg-[#e4e7ec]"
                                }`}
                            >
                                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${selectedProjects.includes(project.id) ? "bg-white" : "bg-white border border-outline-variant/30"}`}>
                                    {selectedProjects.includes(project.id) && <span className="material-symbols-outlined text-[10px] text-primary font-bold">check</span>}
                                </div>
                                {project.name}
                            </button>
                          ))}
                          <button type="button" className="w-8 h-8 rounded-full bg-[#e6fcf2] text-primary flex items-center justify-center hover:bg-[#d0fbe4] transition-colors ml-1">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {employmentType === 'temporary' && (
                    <div className="flex flex-col gap-2 animate-fade-up">
                        <Label htmlFor="employmentEndDate" className="text-sm font-bold text-on-surface">End Date</Label>
                        <Input
                            id="employmentEndDate"
                            name="employmentEndDate"
                            type="date"
                            required
                            className="bg-[#f8f9fc] border-none shadow-none h-12 rounded-xl px-4"
                        />
                    </div>
                )}
              </div>

              {/* SECTION: FINANCIAL DETAILS */}
              <div className="flex flex-col gap-5 mt-4">
                <h3 className="text-xs font-bold text-primary tracking-widest uppercase mb-1">
                  Financial Details
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wage" className="text-sm font-bold text-on-surface">
                      Wage/Salary
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant font-medium">$</span>
                      <Input 
                        id="wage" 
                        name="wage" 
                        type="number" 
                        step="0.01" 
                        required 
                        placeholder="0.00"
                        className="bg-[#f8f9fc] border-none shadow-none h-12 rounded-xl text-base pl-8" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wageType" className="text-sm font-bold text-on-surface">
                      Wage Type
                    </Label>
                    <Select name="wageType" required defaultValue="monthly">
                      <SelectTrigger className="bg-[#f8f9fc] border-none shadow-none h-12 rounded-xl text-base px-4 font-medium">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="overtimeRateMultiplier" className="text-sm font-bold text-on-surface">
                      OT Rate (x)
                    </Label>
                    <Input 
                      id="overtimeRateMultiplier" 
                      name="overtimeRateMultiplier" 
                      type="number" 
                      step="0.1" 
                      defaultValue="1.5" 
                      className="bg-[#f8f9fc] border-none shadow-none h-12 rounded-xl text-base px-4" 
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-2">
                  <Label htmlFor="notes" className="text-sm font-bold text-on-surface">
                    Additional Notes
                  </Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    placeholder="Mention specific contract terms or onboarding tasks..."
                    className="bg-[#f8f9fc] border-none shadow-none min-h-[100px] rounded-xl text-base p-4 resize-none placeholder:text-outline-variant placeholder:font-medium" 
                  />
                </div>
              </div>

            </div>
          </ScrollArea>

          {/* Footer Area */}
          <div className="flex items-center justify-end gap-6 p-6 bg-white border-t border-outline-variant/10 z-20">
            <DialogClose asChild>
              <button type="button" className="text-sm font-bold text-outline hover:text-on-surface transition-colors">
                Cancel
              </button>
            </DialogClose>
            <Button 
                type="submit" 
                disabled={isLoading || projectsLoading}
                className="bg-[#00a86b] hover:bg-[#00905a] text-white h-12 px-8 rounded-xl font-bold text-sm shadow-md"
            >
              {isLoading ? "Saving..." : "Save Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
