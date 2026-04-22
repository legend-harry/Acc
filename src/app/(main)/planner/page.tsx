
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useClient } from "@/context/client-context";
import { useUser } from "@/context/user-context";
import { useBudgets, useProjects } from "@/hooks/use-database";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Trash2, Sparkles, Settings, LandPlot, Briefcase, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FARM_TYPES, BUSINESS_CATEGORIES } from "@/lib/onboarding-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { BudgetSummary, Project } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectFilter } from "@/context/project-filter-context";
import { useSubscription } from "@/context/subscription-context";


function DeleteCategoryDialog({
  category,
  onConfirm,
  isOpen,
  onOpenChange,
}: {
  category: BudgetSummary;
  onConfirm: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the 
            <span className="font-bold"> "{category.category}"</span> category and its budget. 
            Existing transactions will not be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Yes, delete it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

function AddProjectDialog({ onSave }: { onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const { toast } = useToast();
  const { isPremium, openUpgradeDialog } = useSubscription();
  const { clientId } = useClient();
  const { selectedProfile } = useUser();

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setProjectName("");
      setTemplateId(null);
      setSelectedCategories([]);
    }
  }, [open]);

  // Sync categories when template changes
  useEffect(() => {
    if (templateId) {
      if (templateId === 'business') {
        setSelectedCategories([...BUSINESS_CATEGORIES]);
      } else if (templateId !== 'custom') {
        const farm = FARM_TYPES.find(f => f.id === templateId);
        if (farm) setSelectedCategories([...farm.presetCategories]);
      } else {
        setSelectedCategories([]);
      }
    }
  }, [templateId]);

  const handleNext = () => {
    if (currentStep === 0) {
      if (!projectName.trim()) {
        toast({ variant: "destructive", title: "Error", description: "Project name is required." });
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (!templateId) {
        toast({ variant: "destructive", title: "Error", description: "Please select a template or 'Custom'." });
        return;
      }
      if (templateId === 'custom') {
        handleSave();
      } else {
        setCurrentStep(2);
      }
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!isPremium) {
      openUpgradeDialog("add-new-project");
      return;
    }
    
    setIsLoading(true);
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();

      // Check for duplicates
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', clientId)
        .eq('profile_id', selectedProfile)
        .ilike('name', projectName.trim());

      if (existingProjects && existingProjects.length > 0) {
        toast({ variant: 'destructive', title: 'Duplicate Project', description: `A project named "${projectName.trim()}" already exists.` });
        setIsLoading(false);
        return;
      }

      // 1. Create Project
      const { data: project, error: projError } = await supabase.from('projects').insert({ 
        name: projectName.trim(),
        client_id: clientId,
        profile_id: selectedProfile
      }).select().single();

      if (projError) throw projError;

      // 2. Create Categories if selected
      if (selectedCategories.length > 0) {
          const budgetsToInsert = selectedCategories.map(cat => ({
              category: cat,
              amount: 0,
              projectid: project.id,
              client_id: clientId,
              profile_id: selectedProfile
          }));
          const { error: budgError } = await supabase.from('budgets').insert(budgetsToInsert);
          if (budgError) throw budgError;
      }

      toast({ title: "Project Initialized", description: `"${projectName.trim()}" is ready with ${selectedCategories.length} categories.` });
      setOpen(false);
      onSave();
      window.location.reload();
    } catch (error) {
      console.error("Failed to add project:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not initialize project." });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleTriggerClick = () => {
     if (!isPremium) {
      openUpgradeDialog("add-new-project");
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <Button onClick={handleTriggerClick}>
          {!isPremium && <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />}
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Project
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <PlusCircle className="h-4 w-4 text-indigo-600" />
            </div>
            <DialogTitle>New Project</DialogTitle>
          </div>
          <DialogDescription>Step {currentStep + 1} of {templateId === 'custom' ? 2 : 3}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {currentStep === 0 && (
            <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g. Q2 Harvest Plan or West Wing Office"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="h-12 text-lg"
                />
                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Give your ledger a professional title</p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4 py-2 animate-in fade-in slide-in-from-bottom-2">
               <Label className="text-base font-bold">Choose a starting template</Label>
               <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setTemplateId('business')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${templateId === 'business' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                     <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={16} className="text-indigo-600" />
                        <span className="font-bold text-sm">General Business</span>
                     </div>
                     <p className="text-[10px] text-muted-foreground">Standard corporate ledger with payroll, office, and marketing tags.</p>
                  </div>

                  {FARM_TYPES.map(type => (
                      <div 
                        key={type.id}
                        onClick={() => setTemplateId(type.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${templateId === type.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                         <div className="flex items-center gap-2 mb-2">
                            <type.icon size={16} className="text-indigo-600" />
                            <span className="font-bold text-sm">{type.title}</span>
                         </div>
                         <p className="text-[10px] text-muted-foreground line-clamp-1">{type.description}</p>
                      </div>
                  ))}

                  <div 
                    onClick={() => setTemplateId('custom')}
                    className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${templateId === 'custom' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                     <span className="font-bold text-sm text-slate-500">None / Custom</span>
                  </div>
               </div>
            </div>
          )}

          {currentStep === 2 && (
             <div className="space-y-4 py-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-2">
                    <Label className="text-base font-bold">Refine Categories</Label>
                    <Button variant="link" size="sm" onClick={() => setSelectedCategories(templateId === 'business' ? [...BUSINESS_CATEGORIES] : FARM_TYPES.find(f => f.id === templateId)?.presetCategories || [])} className="text-xs h-auto p-0">Reset All</Button>
                </div>
                <Card className="border-slate-100 shadow-none">
                    <ScrollArea className="h-[250px] p-4">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                            { (templateId === 'business' ? BUSINESS_CATEGORIES : (FARM_TYPES.find(f => f.id === templateId)?.presetCategories || [])).map(cat => (
                                <div key={cat} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`proj-${cat}`} 
                                        checked={selectedCategories.includes(cat)}
                                        onCheckedChange={() => toggleCategory(cat)}
                                    />
                                    <label htmlFor={`proj-${cat}`} className="text-sm font-medium leading-none cursor-pointer line-clamp-1">
                                        {cat}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
             </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 border-t flex-row justify-between items-center space-x-0">
            <Button variant="ghost" onClick={() => currentStep === 0 ? setOpen(false) : setCurrentStep(prev => prev - 1)} disabled={isLoading}>
                {currentStep === 0 ? "Cancel" : "Back"}
            </Button>
            <Button onClick={handleNext} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]">
                {isLoading ? "Creating..." : currentStep === (templateId === 'custom' ? 1 : 2) ? "Finish" : "Continue"}
                {!isLoading && currentStep < (templateId === 'custom' ? 1 : 2) && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}


function AddCategoryDialog({ onSave, projectId }: { onSave: () => void, projectId: string }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [budget, setBudget] = useState("");
  const { toast } = useToast();
  const { clientId } = useClient();
  const { selectedProfile } = useUser();

  const handleSave = async () => {
    if (!categoryName.trim()) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Category name is required.",
        });
        return;
    }
    
    setIsLoading(true);
    try {
        const supabase = (await import('@/lib/supabase/client')).createClient();
        const { error } = await supabase.from('budgets').insert({
            category: categoryName.trim(),
            amount: parseFloat(budget) || 0,
            projectid: projectId !== 'all' ? projectId : null,
            client_id: clientId,
            profile_id: selectedProfile
        });
        if (error) throw error;
        toast({
            title: "Category Added",
            description: `Successfully added the "${categoryName.trim()}" category.`,
        });
        setOpen(false);
        setCategoryName("");
        setBudget("");
        onSave();
        window.location.reload();
    } catch (error) {
        console.error("Failed to add category:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save the new category.",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
      <Dialog open={open} onOpenChange={setOpen}>
          <Button variant="outline" onClick={() => setOpen(true)} disabled={!projectId || projectId === 'all'}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Category
          </Button>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                      Create a new category for your transactions and set an optional monthly budget for it.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category-name" className="text-right">
                          Name
                      </Label>
                      <Input
                          id="category-name"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          className="col-span-3"
                          placeholder="e.g., Groceries"
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="budget-amount" className="text-right">
                          Budget (₹)
                      </Label>
                      <Input
                          id="budget-amount"
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="col-span-3"
                          placeholder="e.g., 10000 (optional)"
                      />
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary">
                          Cancel
                      </Button>
                  </DialogClose>
                  <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Category"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
  );
}


export default function PlannerPage() {
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { projects, loading: projectsLoading } = useProjects();
  const { selectedProjectId, setSelectedProjectId } = useProjectFilter();

  const [localBudgets, setLocalBudgets] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [deletingCategory, setDeletingCategory] = useState<BudgetSummary | null>(null);


  const [refreshKey, setRefreshKey] = useState(0);

  const activeProjects = useMemo(() => projects.filter(p => !p.archived), [projects]);


  useEffect(() => {
    // If the globally selected project is "all", default to the first active project if available.
    if (selectedProjectId === 'all' && activeProjects.length > 0) {
      setSelectedProjectId(activeProjects[0].id);
    } else if (!selectedProjectId && activeProjects.length > 0) {
      // If nothing is selected, default to the first active project
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [activeProjects, selectedProjectId, setSelectedProjectId]);

  const projectBudgets = useMemo(() => {
    if (selectedProjectId === 'all') return [];
    return budgets.filter(b => b.projectid === selectedProjectId);
  }, [budgets, selectedProjectId]);

  useEffect(() => {
    if (!budgetsLoading) {
      const budgetMap = projectBudgets.reduce((acc, budget) => {
        acc[budget.category] = budget.budget;
        return acc;
      }, {} as Record<string, number>);
      setLocalBudgets(budgetMap);
    }
  }, [projectBudgets, budgetsLoading, refreshKey, selectedProjectId]);

  const handleBudgetChange = (category: string, value: string) => {
    const amount = parseInt(value, 10);
    setLocalBudgets((prev) => ({
      ...prev,
      [category]: isNaN(amount) ? 0 : amount,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    const updates: Record<string, any> = {};
    Object.keys(localBudgets).forEach(category => {
        const budgetItem = projectBudgets.find(b => b.category === category);
        if (budgetItem && budgetItem.id && budgetItem.budget !== localBudgets[category]) {
            updates[`/budgets/${budgetItem.id}/budget`] = localBudgets[category];
        }
    });

    if (Object.keys(updates).length === 0) {
        toast({
            title: "No Changes",
            description: "There were no changes to save.",
        });
        setIsLoading(false);
        return;
    }

    try {
        /* TODO: migrate db update */
        toast({
            title: "Planner Saved",
            description: "Your new budget goals have been updated.",
        });
    } catch (error) {
        console.error("Failed to save budgets:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save budgets.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
        const supabase = (await import('@/lib/supabase/client')).createClient();
        const { error } = await supabase.from('budgets').delete().eq('id', deletingCategory.id);
        if (error) throw error;
        toast({
            title: "Category Deleted",
            description: `The "${deletingCategory.category}" category has been deleted.`,
        });
        setDeletingCategory(null);
        setRefreshKey(k => k + 1); // Force a refresh
    } catch (error) {
        console.error("Failed to delete category:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the category.",
        });
    }
  }
  
  const loading = budgetsLoading || projectsLoading;

  if (loading) {
      return (
          <div>
              <PageHeader
                title="Planner"
                description="Set and manage your monthly spending goals for each project."
              />
              <Card>
                <CardHeader>
                  <CardTitle>Category Budgets</CardTitle>
                  <CardDescription>
                    Define a monthly budget for each category to track your spending.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="grid grid-cols-3 items-center gap-4">
                            <Skeleton className="h-6 w-24" />
                            <div className="col-span-2">
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    ))}
                </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div>
      <PageHeader
        title="Planner"
        description="Set and manage your monthly spending goals for each project."
      >
        <AddProjectDialog onSave={() => setRefreshKey(k => k + 1)} />
        <Button asChild variant="outline">
            <Link href="/profile">
                <Settings className="mr-2 h-4 w-4" />
                Settings
            </Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div className="space-y-1">
                <CardTitle className="text-2xl">Category Budgets</CardTitle>
                <CardDescription>
                  Select a project to manage its categories and budgets.
                </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={activeProjects.length === 0}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                      {activeProjects.map((project: Project) => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              <AddCategoryDialog onSave={() => setRefreshKey(k => k + 1)} projectId={selectedProjectId} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          {selectedProjectId !== 'all' && projectBudgets.map((budget) => (
            <div key={budget.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
              <Label htmlFor={`budget-${budget.category}`}>{budget.category}</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">₹</span>
                <Input
                  id={`budget-${budget.category}`}
                  type="number"
                  placeholder="e.g., 500"
                  value={localBudgets[budget.category] || ""}
                  onChange={(e) => handleBudgetChange(budget.category, e.target.value)}
                  className="w-full"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeletingCategory(budget)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
           {activeProjects.length === 0 && (
              <p className="text-muted-foreground text-center col-span-3 py-10">No active projects found. Add one to get started.</p>
           )}
           {activeProjects.length > 0 && selectedProjectId === 'all' && (
              <p className="text-muted-foreground text-center col-span-3 py-10">Please select a project to view or edit its budgets.</p>
           )}
           {selectedProjectId && selectedProjectId !== 'all' && projectBudgets.length === 0 && (
              <p className="text-muted-foreground text-center col-span-3 py-10">This project has no categories. Add one to start tracking your new project!</p>
           )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isLoading || projectBudgets.length === 0}>
            {isLoading ? "Saving..." : "Save Budgets"}
          </Button>
        </CardFooter>
      </Card>
      {deletingCategory && (
        <DeleteCategoryDialog 
            category={deletingCategory}
            isOpen={!!deletingCategory}
            onOpenChange={(isOpen) => {
                if (!isOpen) setDeletingCategory(null);
            }}
            onConfirm={handleDeleteCategory}
        />
      )}
    </div>
  );
}
