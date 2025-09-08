import { generateSpendingInsights } from "@/ai/flows/generate-spending-insights";
import { transactions } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

function formatDataForAI(data: typeof transactions): string {
  const headers = "Date,Category,Amount,Description";
  const rows = data.map(t => 
    `${t.date.toISOString().split('T')[0]},"${t.category}","${t.amount}","${t.description.replace(/"/g, '""')}"`
  );
  return [headers, ...rows].join('\n');
}

export async function AIInsights() {
  let insights = "Could not generate insights at this time.";
  try {
    const spendingData = formatDataForAI(transactions);
    const result = await generateSpendingInsights({ spendingData });
    if (result.insights) {
      insights = result.insights;
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
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{insights}</div>
      </CardContent>
    </Card>
  );
}
