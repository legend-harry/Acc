
"use client";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ref, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Project, Employee } from "@/types";

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
  const [defaultProject, setDefaultProject] = useState<string>("all");
  const [primaryEmployee, setPrimaryEmployee] = useState<string>("");

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
    localStorage.setItem("primaryEmployeeId", employeeId);
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
                    <SelectItem value="">None</SelectItem>
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
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [newProjectName, setNewProjectName] = useState("");
    const [defaultProject, setDefaultProject] = useState<string>("");

    useEffect(() => {
        const storedDefault = localStorage.getItem("defaultProjectId");
        if (storedDefault) {
            setDefaultProject(storedDefault);
        }
    }, []);

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

        try {
            const projectRef = ref(db, `projects/${editingProject.id}`);
            await update(projectRef, { name: newProjectName.trim() });
            toast({
                title: "Project Updated",
                description: `Successfully renamed to "${newProjectName.trim()}".`
            });
        } catch (error) {
            console.error("Failed to update project", error);
            toast({ variant: "destructive", title: "Update Failed"});
        } finally {
            setEditingProject(null);
            setNewProjectName("");
        }
    }

    const handleDeleteProject = async () => {
        if (!deletingProject) return;

        try {
            await remove(ref(db, `projects/${deletingProject.id}`));
            // Note: This doesn't delete associated transactions/budgets.
            toast({
                title: "Project Deleted",
                description: `Project "${deletingProject.name}" has been deleted.`
            });
        } catch (error) {
             console.error("Failed to delete project", error);
            toast({ variant: "destructive", title: "Deletion Failed"});
        } finally {
            setDeletingProject(null);
        }
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>Edit or delete your projects.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {projects.map(project => (
                        <li key={project.id} className="flex items-center justify-between p-3 rounded-md border">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{project.name}</span>
                                {project.id === defaultProject && (
                                    <span className="text-xs text-muted-foreground">(default)</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(project)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingProject(project)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </li>
                    ))}
                    {loading && <li className="text-muted-foreground">Loading projects...</li>}
                    {!loading && projects.length === 0 && <li className="text-muted-foreground text-center py-4">No projects found.</li>}
                </ul>
            </CardContent>

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

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingProject} onOpenChange={(isOpen) => !isOpen && setDeletingProject(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the project <span className="font-bold">"{deletingProject?.name}"</span>. 
                            This action does not delete associated transactions or budgets.
                            This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProject}>
                            Yes, delete project
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

export default function ProfilePage() {
  const { user } = useUser();

  return (
    <div>
      <PageHeader
        title={`${user}'s Profile`}
        description="View and manage your profile information and settings."
      />
      <Tabs defaultValue="settings" className="w-full">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="profile" disabled>
            Profile
          </TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="mt-6">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="projects" className="mt-6">
            <ProjectSettings />
        </TabsContent>
        <TabsContent value="profile">
          <p>Profile details coming soon.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
