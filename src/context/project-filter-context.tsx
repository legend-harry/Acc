
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useProjects } from "@/hooks/use-database";

type ProjectFilterContextType = {
    selectedProjectId: string;
    setSelectedProjectId: (id: string) => void;
};

const ProjectFilterContext = createContext<ProjectFilterContextType | undefined>(undefined);

export function ProjectFilterProvider({ children }: { children: ReactNode }) {
    const [selectedProjectId, setSelectedProjectIdState] = useState<string>("all");
    const { projects } = useProjects();

    useEffect(() => {
        const defaultProjectId = localStorage.getItem('defaultProjectId');
        const sessionProjectId = sessionStorage.getItem('selectedProjectId');
        
        if (sessionProjectId) {
            setSelectedProjectIdState(sessionProjectId);
        } else if (defaultProjectId) {
            setSelectedProjectIdState(defaultProjectId);
            sessionStorage.setItem('selectedProjectId', defaultProjectId);
        } else {
            setSelectedProjectIdState("all");
        }
    }, []);

    const setSelectedProjectId = (id: string) => {
        setSelectedProjectIdState(id);
        sessionStorage.setItem('selectedProjectId', id);
    };

    useEffect(() => {
        if (!projects.length || selectedProjectId === "all") {
            return;
        }

        const hasSelectedProject = projects.some((project) => project.id === selectedProjectId);
        if (hasSelectedProject) {
            return;
        }

        const defaultProjectId = localStorage.getItem("defaultProjectId");
        const hasValidDefault = defaultProjectId && projects.some((project) => project.id === defaultProjectId);
        const safeProjectId = hasValidDefault ? defaultProjectId! : "all";

        setSelectedProjectIdState(safeProjectId);
        sessionStorage.setItem("selectedProjectId", safeProjectId);
    }, [projects, selectedProjectId]);

    return (
        <ProjectFilterContext.Provider value={{ selectedProjectId, setSelectedProjectId }}>
            {children}
        </ProjectFilterContext.Provider>
    );
}

export function useProjectFilter() {
    const context = useContext(ProjectFilterContext);
    if (context === undefined) {
        throw new Error("useProjectFilter must be used within a ProjectFilterProvider");
    }
    return context;
}
