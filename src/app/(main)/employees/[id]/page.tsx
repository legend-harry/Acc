
"use client";

import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  // This is a placeholder page. In the future, you would fetch employee details
  // using the `id` and display their profile, attendance history, etc.

  return (
    <div>
      <PageHeader
        title="Employee Profile"
        description={`Details for employee ID: ${id}`}
      />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
