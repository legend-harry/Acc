import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export function PageHeader({ title, description, className, children, ...props }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4 animate-fade-up", className)} {...props}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline" style={{ fontFamily: "'Manrope', sans-serif" }}>{title}</h1>
        {description && <p className="text-muted-foreground/70 mt-1.5 text-sm">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
