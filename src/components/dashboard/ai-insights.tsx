
"use client";

import { useState } from "react";
import { generateSpendingInsights } from "@/ai/flows/generate-spending-insights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles } from "lucide-react";
import type { Transaction } from "@/types";
import { Skeleton } from "../ui/skeleton";
import { useSubscription } from "@/context/subscription-context";

function formatDataForAI(data: Transaction[]): string {
  const headers = "Date,Category,Amount,Description";
  const rows = data.map(t => 
    `${new Date(t.date).toISOString().split('T')[0]},"${t.category}","${t.amount}","${(t.description || '').replace(/"/g, '""')}"`
  );
  return [headers, ...rows].join('\n');
}

function formatInsights(text: string) {
    return text.split('\n').map(line => line.replace(/•/g, '').trim()).filter(line => line.length > 0).map((line, index) => (
        <li key={index} className="mb-2">{line}</li>
    ));
}

export function AIInsights({transactions}: {transactions?: Transaction[]}) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isPremium, openUpgradeDialog } = useSubscription();


  const handleGenerateInsights = async () => {
    if (!isPremium) {
      openUpgradeDialog("ai-insights");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
        if (transactions && transactions.length > 0) {
            const spendingData = formatDataForAI(transactions);
            const result = await generateSpendingInsights({ spendingData });
            if (result.insights) {
                setInsights(result.insights);
            } else {
                setError("No insights could be generated for this period.");
            }
        } else {
            setError("Not enough data to generate insights.");
        }
    } catch (e) {
        console.error("Error generating AI insights:", e);
        if (e instanceof Error && e.message.includes('503')) {
            setError("The AI model is currently overloaded. Please try again in a few moments.");
        } else {
            setError("Could not generate insights at this time.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  let content: React.ReactNode;
    if (isLoading) {
        content = (
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        );
    } else if (error) {
        content = <p className="text-destructive">{error}</p>;
    } else if (insights) {
        content = <ul>{formatInsights(insights)}</ul>;
    } else {
        content = (
            <div className="flex flex-col items-start gap-4">
                 <p className="text-muted-foreground">
                    Click the button to generate AI-powered suggestions and find patterns in your spending.
                </p>
                <Button onClick={handleGenerateInsights} disabled={isLoading || !transactions || transactions.length === 0}>
                    {!isPremium && <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />}
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {isLoading ? "Generating..." : "Generate Insights"}
                </Button>
                {!transactions || transactions.length === 0 && <p className="text-xs text-muted-foreground">Not enough data to generate insights.</p>}
            </div>
        )
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-accent" />
          AI Insights
        </CardTitle>
        <CardDescription>
            {insights ? "Suggestions and patterns based on your spending." : "Get AI-powered suggestions and find patterns in your spending."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm">{content}</div>
      </CardContent>
    </Card>
  );
}
