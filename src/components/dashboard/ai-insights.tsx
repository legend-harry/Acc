import { generateSpendingInsights } from "@/ai/flows/generate-spending-insights";
import { transactions as allTransactions } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import type { Transaction } from "@/types";

function formatDataForAI(data: Transaction[]): string {
  const headers = "Date,Category,Amount,Description";
  const rows = data.map(t => 
    `${t.date.toISOString().split('T')[0]},"${t.category}","${t.amount}","${t.description.replace(/"/g, '""')}"`
  );
  return [headers, ...rows].join('\n');
}

function formatInsights(text: string) {
    return text.split('\n').map(line => line.replace(/•/g, '').trim()).filter(line => line.length > 0).map((line, index) => (
        <li key={index} className="mb-2">{line}</li>
    ));
}

export async function AIInsights({transactions}: {transactions?: Transaction[]}) {
  let content: React.ReactNode = "Could not generate insights at this time.";
  try {
    const dataToAnalyze = transactions || allTransactions;
    if (dataToAnalyze.length > 0) {
        const spendingData = formatDataForAI(dataToAnalyze);
        const result = await generateSpendingInsights({ spendingData });
        if (result.insights) {
          content = <ul>{formatInsights(result.insights)}</ul>;
        }
    } else {
        content = "Not enough data to generate insights.";
    }
  } catch (error) {
    console.error("Error generating AI insights:", error);
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-accent" />
          AI Insights
        </CardTitle>
        <CardDescription>
            Suggestions and patterns based on your spending.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">{content}</div>
      </CardContent>
    </Card>
  );
}
