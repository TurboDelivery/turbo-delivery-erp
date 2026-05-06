export function StatCard({ icon, iconBg, label, value, isText }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number | string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className="mb-2 flex items-center gap-3">
        <div className={`rounded-lg p-2 ${iconBg}`}>{icon}</div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className={`font-bold text-gray-900 ${isText ? 'text-xl' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}
