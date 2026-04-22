
"use client";

import { PageHeader } from "@/components/page-header";
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Currency, useCurrency } from "@/context/currency-context";
import { useUser } from "@/context/user-context";
import { useProjects, useEmployees } from "@/hooks/use-database";
import { useProjectFilter } from "@/context/project-filter-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Archive, ArchiveRestore, ArchiveX } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Project, Employee } from "@/types";
import { Separator } from "@/components/ui/separator";
import { useLayout } from "@/context/layout-context";

const currencies: { value: Currency; label: string }[] = [
  { value: "INR", label: "INR (Indian Rupee)" },
  { value: "USD", label: "USD (US Dollar)" },
  { value: "EUR", label: "EUR (Euro)" },
  { value: "GBP", label: "GBP (British Pound)" },
];

function SettingsTab() {
  const { currency, setCurrency } = useCurrency();
  const { projects } = useProjects();
  const { employees } = useEmployees();
  const { selectedProjectId, setSelectedProjectId } = useProjectFilter();
  const { layout, setLayout } = useLayout();
  const [defaultProject, setDefaultProject] = useState<string>("all");
  const [primaryEmployee, setPrimaryEmployee] = useState<string>("none");

  useEffect(() => {
    const storedDefault = localStorage.getItem("defaultProjectId");
    if (storedDefault) {
      setDefaultProject(storedDefault);
    }
    const storedPrimary = localStorage.getItem("primaryEmployeeId");
    if (storedPrimary) {
      setPrimaryEmployee(storedPrimary);
    }
  }, []);

  const handleDefaultProjectChange = (projectId: string) => {
    setDefaultProject(projectId);
    localStorage.setItem("defaultProjectId", projectId);
    // Also update the current session's filter if it was on the old default
    if (selectedProjectId === localStorage.getItem("defaultProjectId")) {
        setSelectedProjectId(projectId);
    }
  }

  const handlePrimaryEmployeeChange = (employeeId: string) => {
    setPrimaryEmployee(employeeId);
    if (employeeId === 'none') {
        localStorage.removeItem("primaryEmployeeId");
    } else {
        localStorage.setItem("primaryEmployeeId", employeeId);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Settings</CardTitle>
        <CardDescription>
          Manage your application-wide preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <Label htmlFor="layout-select">UI Layout</Label>
          <div className="md:col-span-2">
            <Select
              value={layout}
              onValueChange={(value) => setLayout(value as "default" | "enterprise")}
            >
              <SelectTrigger id="layout-select" className="w-full">
                <SelectValue placeholder="Select a layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Classic (Top Navigation)</SelectItem>
                <SelectItem value="enterprise">Enterprise (Sidebar Navigation)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">
              Switch between the classic header bar and the enterprise sidebar layout.
            </p>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <Label htmlFor="currency-select">Currency</Label>
          <div className="md:col-span-2">
            <Select
              value={currency}
              onValueChange={(value) => setCurrency(value as Currency)}
            >
              <SelectTrigger id="currency-select" className="w-full">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <Label htmlFor="default-project-select">Default Project</Label>
          <div className="md:col-span-2">
            <Select value={defaultProject} onValueChange={handleDefaultProjectChange}>
              <SelectTrigger id="default-project-select" className="w-full">
                <SelectValue placeholder="Select a default project" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.id === defaultProject && "(default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
            <Label htmlFor="primary-employee-select">Primary Employee for Notifications</Label>
            <div className="md:col-span-2">
                <Select value={primaryEmployee} onValueChange={handlePrimaryEmployeeChange}>
                <SelectTrigger id="primary-employee-select" className="w-full">
                    <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {employees.map((e: Employee) => (
                    <SelectItem key={e.id} value={e.id}>
                        {e.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectSettings() {
    const { projects, loading } = useProjects();
    const { toast } = useToast();
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [archivingProject, setArchivingProject] = useState<Project | null>(null);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [newProjectName, setNewProjectName] = useState("");
    const [defaultProject, setDefaultProject] = useState<string>("");

    useEffect(() => {
        const storedDefault = localStorage.getItem("defaultProjectId");
        if (storedDefault) {
            setDefaultProject(storedDefault);
        }
    }, []);

    const { activeProjects, archivedProjects } = useMemo(() => {
        const active = projects.filter(p => !p.archived);
        const archived = projects.filter(p => p.archived);
        return { activeProjects: active, archivedProjects: archived };
    }, [projects]);


    const handleEditClick = (project: Project) => {
        setEditingProject(project);
        setNewProjectName(project.name);
    }
    
    const handleUpdateProject = async () => {
        if (!editingProject || !newProjectName.trim()) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Project name cannot be empty."
            });
            return;
        }

        // TODO: Migrate to Supabase update
        toast({ title: "Coming Soon", description: "Project rename will be available after full Supabase migration." });
        setEditingProject(null);
        setNewProjectName("");
    }
    
    const handleArchiveProject = async () => {
        if (!archivingProject) return;
        // TODO: Migrate to Supabase update
        toast({ title: "Coming Soon", description: "Project archiving will be available after full Supabase migration." });
        setArchivingProject(null);
    }
    
    const handleRestoreProject = async (project: Project) => {
        // TODO: Migrate to Supabase update
        toast({ title: "Coming Soon", description: "Project restore will be available after full Supabase migration." });
    }


    const handleDeleteProject = async () => {
        if (!deletingProject) return;
        // TODO: Migrate to Supabase delete
        toast({ title: "Coming Soon", description: "Project deletion will be available after full Supabase migration." });
        setDeletingProject(null);
    }


    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Project Management</CardTitle>
                    <CardDescription>Edit or archive your active projects.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {activeProjects.map(project => (
                            <li key={project.id} className="flex items-center justify-between p-3 rounded-md border">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{project.name}</span>
                                    {project.id === defaultProject && (
                                        <span className="text-xs text-muted-foreground">(default)</span>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(project)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-muted-foreground" onClick={() => setArchivingProject(project)}>
                                        <Archive className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingProject(project)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                        {loading && <li className="text-muted-foreground">Loading projects...</li>}
                        {!loading && activeProjects.length === 0 && <li className="text-muted-foreground text-center py-4">No active projects found.</li>}
                    </ul>
                </CardContent>
            </Card>

            {archivedProjects.length > 0 && (
                 <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Archive className="h-5 w-5" />
                            Archived Projects
                        </CardTitle>
                        <CardDescription>Restore projects or delete them permanently.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {archivedProjects.map(project => (
                                <li key={project.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/50">
                                    <span className="font-medium text-muted-foreground">{project.name}</span>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRestoreProject(project)}>
                                            <ArchiveRestore className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingProject(project)}>
                                            <ArchiveX className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

             {/* Edit Dialog */}
            <Dialog open={!!editingProject} onOpenChange={(isOpen) => !isOpen && setEditingProject(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Project Name</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="edit-project-name">Project Name</Label>
                        <Input 
                            id="edit-project-name" 
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateProject}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Archive Confirmation */}
            <AlertDialog open={!!archivingProject} onOpenChange={(isOpen) => !isOpen && setArchivingProject(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive Project?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to archive the project <span className="font-bold">"{archivingProject?.name}"</span>? 
                            It will be hidden from the main app but can be restored later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchiveProject}>
                            Yes, archive it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingProject} onOpenChange={(isOpen) => !isOpen && setDeletingProject(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the project <span className="font-bold">"{deletingProject?.name}"</span>. 
                            This action does not delete associated transactions or budgets and cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default function ProfilePage() {
  const { userData } = useUser();
  const displayName = userData?.user_metadata?.full_name || userData?.email || "User";

  return (
    <div>
      <PageHeader
        title={`${displayName}'s Profile`}
        description="View and manage your profile information and settings."
      />
      <Tabs defaultValue="projects" className="w-full">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="profile" disabled>
            Profile
          </TabsTrigger>
        </TabsList>
        <TabsContent value="projects" className="mt-6">
            <ProjectSettings />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="profile">
          <p>Profile details coming soon.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
