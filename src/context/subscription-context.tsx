
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type UpgradeSource = "add-new-project" | "ai-insights" | "export-all" | "download-pdf" | "special-theme";

type SubscriptionContextType = {
    isPremium: boolean;
    setPremium: () => void;
    isUpgradeDialogVisible: boolean;
    openUpgradeDialog: (source: UpgradeSource) => void;
    closeUpgradeDialog: () => void;
    upgradeSource: UpgradeSource | null;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const [isPremium, setIsPremium] = useState(false);
    const [isUpgradeDialogVisible, setUpgradeDialogVisible] = useState(false);
    const [upgradeSource, setUpgradeSource] = useState<UpgradeSource | null>(null);

    useEffect(() => {
        const storedStatus = localStorage.getItem('premiumStatus');
        if (storedStatus === 'true') {
            setIsPremium(true);
        }
    }, []);

    const setPremium = () => {
        setIsPremium(true);
        localStorage.setItem('premiumStatus', 'true');
    };

    const openUpgradeDialog = (source: UpgradeSource) => {
        setUpgradeSource(source);
        setUpgradeDialogVisible(true);
    };

    const closeUpgradeDialog = () => {
        setUpgradeDialogVisible(false);
        setUpgradeSource(null);
    };

    return (
        <SubscriptionContext.Provider value={{ isPremium, setPremium, isUpgradeDialogVisible, openUpgradeDialog, closeUpgradeDialog, upgradeSource }}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error("useSubscription must be used within a SubscriptionProvider");
    }
    return context;
}
