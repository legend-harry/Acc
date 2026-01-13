"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FinancialDashboard({ pondId }: { pondId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Data</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Financial data will be retrieved from the database for pond {pondId}. Add financial records to view analytics and projections here.
        </p>
      </CardContent>
    </Card>
  );
}
