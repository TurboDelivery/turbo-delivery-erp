import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title: string;
    subtitle: string;
    illustration?: string;
    children?: React.ReactNode;
    className?: string;
}
export default function EmptyState({ title, subtitle, className, children }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center h-full space-y-4 min-h-[200px]", className)}>
            <div className="text-2xl font-bold text-foreground">{title}</div>
            <div className="text-md text-muted font-bold">{subtitle}</div>
            {children}
        </div>
    );
}
