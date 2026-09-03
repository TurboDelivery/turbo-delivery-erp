import { Card } from '@heroui-v3/react';

interface StatSummaryCardProps {
    label: string;
    value: string;
    color: string;
    boldColor: string;
}

export default function StatSummaryCard({ label, value, color, boldColor }: StatSummaryCardProps) {
    return (
        <Card className="gap-0 rounded-lg p-4 text-center" style={{ backgroundColor: `${color}20` }} variant="transparent">
            <p className="text-sm font-medium" style={{ color }}>
                {label}
            </p>
            <p className="truncate text-sm font-bold sm:text-base md:text-xl" style={{ color: boldColor }}>
                {value}
            </p>
        </Card>
    );
}
