
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { generateSpendingInsights } from "@/ai/flows/generate-spending-insights";
import type { Transaction } from "@/types";
import { useSubscription } from "@/context/subscription-context";
import { useCurrency } from "@/context/currency-context";


declare global {
    interface Window {
        jspdf: any;
    }
}

function formatDataForAI(data: Transaction[]): string {
    const headers = "Date,Category,Amount,Description";
    const rows = data.map(t => 
      `${t.date.toISOString().split('T')[0]},"${t.category}","${t.amount}","${(t.description || "").replace(/"/g, '""')}"`
    );
    return [headers, ...rows].join('\n');
}

async function generatePdf(monthSlug: string, monthName: string, transactions: Transaction[], insights: string, currency: string) {
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text(`Expense Report: ${monthName}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Total Transactions: ${transactions.length}`, 14, 30);

    const tableColumn = ["Date", "Description", "Category", "Amount"];
    const tableRows: (string|number)[][] = [];

    transactions.forEach(ticket => {
        const ticketData = [
            ticket.date.toLocaleDateString(),
            ticket.title,
            ticket.category,
            formatCurrency(ticket.amount, currency)
        ];
        tableRows.push(ticketData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 60;

    doc.setFontSize(16);
    doc.text("AI Insights", 14, finalY + 15);
    doc.setFontSize(10);
    
    // Split the text into lines to respect the maxWidth
    const splitInsights = doc.splitTextToSize(insights, 180);
    doc.text(splitInsights, 14, finalY + 22);

    doc.save(`report-${monthSlug}.pdf`);
}

export function ReportDownloadButton({ monthSlug, monthName, transactions }: { monthSlug: string, monthName: string, transactions: Transaction[] }) {
    const [isLoading, setIsLoading] = useState(false);
    const { isPremium, openUpgradeDialog } = useSubscription();
    const { currency } = useCurrency();

    const handleDownload = async () => {
        if (!isPremium) {
            openUpgradeDialog("download-pdf");
            return;
        }

        setIsLoading(true);
        try {
            const spendingData = formatDataForAI(transactions);
            const result = await generateSpendingInsights({ spendingData });
            const insights = result.insights || "No insights could be generated for this period.";
            await generatePdf(monthSlug, monthName, transactions, insights, currency);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            // You might want to show a toast message to the user here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isLoading}>
            {!isPremium && <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />}
            <Download className="mr-2 h-4 w-4" />
            {isLoading ? "Generating..." : "Download PDF"}
        </Button>
    );
}
