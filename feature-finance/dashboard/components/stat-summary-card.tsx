interface StatSummaryCardProps {
  label: string;
  value: string;
  color: string;
  boldColor: string;
}

export default function StatSummaryCard({ label, value, color, boldColor }: StatSummaryCardProps) {
  return (
    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${color}20` }}>
      <p className="text-sm font-medium" style={{ color }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: boldColor }}>{value}</p>
    </div>
  );
}
