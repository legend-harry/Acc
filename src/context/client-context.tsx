"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ClientContextType = {
    clientId: string;
    setClientId: (id: string) => void;
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
    const [clientId, setClientIdState] = useState("default-client");

    useEffect(() => {
        const stored = localStorage.getItem("activeClientId");
        if (stored) {
            setClientIdState(stored);
        }
    }, []);

    const setClientId = (id: string) => {
        setClientIdState(id);
        localStorage.setItem("activeClientId", id);
    };

    return (
        <ClientContext.Provider value={{ clientId, setClientId }}>
            {children}
        </ClientContext.Provider>
    );
}

export function useClient() {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error("useClient must be used within a ClientProvider");
    }
    return context;
}
