
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Currency = "INR" | "USD" | "EUR" | "GBP";

type CurrencyContextType = {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>("INR");

    useEffect(() => {
        const storedCurrency = localStorage.getItem('app-currency') as Currency;
        if (storedCurrency) {
            setCurrencyState(storedCurrency);
        }
    }, []);

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
        localStorage.setItem('app-currency', newCurrency);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}
