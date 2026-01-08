
"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Sparkles } from "lucide-react";
import { useSubscription } from "@/context/subscription-context";
import { useRouter } from "next/navigation";


const freeFeatures = [
    "Unlimited transactions",
    "Interactive data visualization",
    "Categorization and budgeting",
    "Responsive mobile experience",
    "Standard reporting",
];

const premiumFeatures = [
    "All features in Free, plus:",
    "Create and manage multiple projects",
    "AI-powered spending insights",
    "Export all data to CSV",
    "Download monthly reports as PDF",
    "Unlock special themes",
];


export default function UpgradePage() {
    const { isPremium, setPremium } = useSubscription();
    const router = useRouter();

    const handleUpgrade = () => {
        setPremium();
        // You might want to show a toast or something here
        router.push("/dashboard");
    }

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="Choose Your Plan"
                description="Unlock powerful features to take full control of your finances."
                className="text-center"
            />
            <div className="grid md:grid-cols-2 gap-8 mt-10">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Free</CardTitle>
                        <CardDescription>Perfect for getting started with personal budgeting.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <p className="text-3xl font-bold">₹0</p>
                         <ul className="space-y-2 text-muted-foreground">
                            {freeFeatures.map(feature => (
                                <li key={feature} className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                     <div className="p-6 pt-0">
                        <Button className="w-full" variant="outline" disabled>Your Current Plan</Button>
                    </div>
                </Card>
                <Card className="flex flex-col border-primary border-2 relative overflow-hidden">
                     <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold rounded-bl-lg flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Most Popular
                    </div>
                    <CardHeader>
                        <CardTitle className="text-primary">Premium</CardTitle>
                        <CardDescription>For power users who want advanced control and insights.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <p className="text-3xl font-bold">₹259 <span className="text-lg font-normal text-muted-foreground">/ month</span></p>
                        <ul className="space-y-2 text-muted-foreground">
                            {premiumFeatures.map(feature => (
                                <li key={feature} className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-yellow-400" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <div className="p-6 pt-0">
                         {isPremium ? (
                            <Button className="w-full" disabled variant="outline">You are a Premium User</Button>
                        ) : (
                            <Button className="w-full" onClick={handleUpgrade}>Get Premium</Button>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}
