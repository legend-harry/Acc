
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type UserContextType = {
    user: string;
    setUser: (user: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState("Vijay"); // Default user

    useEffect(() => {
        // On initial load, check if a profile is stored in localStorage
        const rememberedProfile = localStorage.getItem('rememberedProfile');
        if (rememberedProfile) {
            setUserState(rememberedProfile);
            sessionStorage.setItem('userProfile', rememberedProfile);
        }
    }, []);

    const setUser = (newUser: string) => {
        setUserState(newUser);
        sessionStorage.setItem('userProfile', newUser);
    };


    return (
        <UserContext.Provider value={{ user, setUser }}>
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
