"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";

export default function TestDemoPage() {
    const router = useRouter();
    const { setUser } = useUser();

    useEffect(() => {
        // Set user to Guest/Demo mode
        setUser("Guest");
        // Save flag for demo bypass 
        sessionStorage.setItem("demoBypass", "true");
        // Redirect to dashboard
        router.push("/dashboard");
    }, [router, setUser]);

    return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground font-medium text-sm">Setting up demo session...</p>
            </div>
        </div>
    );
}
