interface StatMiniProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  highlight?: boolean;
}

export default function StatMini({ label, value, sub, icon: Icon, highlight }: StatMiniProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span
        className={[
          'text-base sm:text-xl font-bold break-words',
          highlight ? 'text-green-600' : 'text-gray-900',
        ].join(' ')}
      >
        {value}
        {sub && <span className="ml-1 text-sm font-medium text-gray-500">{sub}</span>}
      </span>
    </div>
  );
}
