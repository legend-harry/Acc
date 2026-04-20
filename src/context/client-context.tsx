"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type ClientContextType = {
    clientId: string;
    setClientId: (id: string) => void;
    isLoading: boolean;
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
    const [clientId, setClientIdState] = useState("default-client");
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const initClient = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setClientIdState(session.user.id);
            }
            setIsLoading(false);
        };
        initClient();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (session?.user) {
                    setClientIdState(session.user.id);
                } else {
                    setClientIdState("default-client");
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const setClientId = (id: string) => {
        setClientIdState(id);
    };

    return (
        <ClientContext.Provider value={{ clientId, setClientId, isLoading }}>
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
