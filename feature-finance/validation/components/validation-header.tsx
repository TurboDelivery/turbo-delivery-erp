import { Role, ROLE_CONFIG } from './validation.constants';

interface ValidationHeaderProps {
  role: Role;
  pendingCount: number;
}

export function ValidationHeader({ role, pendingCount }: ValidationHeaderProps) {
  const config = ROLE_CONFIG[role];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-red-600">Finance &amp; Workflow</h1>
            <p className="mt-0.5 text-sm text-gray-500">Gestion des flux financiers</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 hover:bg-gray-100 transition-colors">
              {pendingCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
            <div className="hidden items-center gap-2 text-sm text-gray-600 md:flex">
              <span className="font-medium">{config.label}</span>
              <span className="text-gray-400">|</span>
              <span>{config.description}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
