
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type ProjectFilterContextType = {
    selectedProjectId: string;
    setSelectedProjectId: (id: string) => void;
};

const ProjectFilterContext = createContext<ProjectFilterContextType | undefined>(undefined);

export function ProjectFilterProvider({ children }: { children: ReactNode }) {
    const [selectedProjectId, setSelectedProjectIdState] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return sessionStorage.getItem('selectedProjectId') || "all";
        }
        return "all";
    });

    useEffect(() => {
        const storedProjectId = sessionStorage.getItem('selectedProjectId');
        if (storedProjectId) {
            setSelectedProjectIdState(storedProjectId);
        }
    }, []);

    const setSelectedProjectId = (id: string) => {
        setSelectedProjectIdState(id);
        sessionStorage.setItem('selectedProjectId', id);
    };

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
