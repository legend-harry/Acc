"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Session, User } from "@supabase/supabase-js";

type UserContextType = {
    user: string | null;
    userData: User | null;
    setUser: (user: string) => void;
    selectedProfile: string;
    isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<string | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        // Initial session check
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserData(session.user);
                setUserState(session.user.id);
            }
            setIsLoading(false);
        };
        
        initAuth();

        // Real-time listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (session?.user) {
                    setUserData(session.user);
                    setUserState(session.user.id);
                } else {
                    setUserData(null);
                    setUserState(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const setUser = (newUser: string) => {
        // Keeping this for compatibility, though you shouldn't manually set Auth User IDs
        setUserState(newUser);
    };

    return (
        <UserContext.Provider value={{ 
            user, 
            userData, 
            setUser, 
            selectedProfile: user || "defaultClient", 
            isLoading 
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
