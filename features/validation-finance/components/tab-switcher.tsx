import { Clock, FileText } from 'lucide-react';
import { SubTab } from './validation.constants';

interface TabSwitcherProps {
  tab: SubTab;
  onChange: (tab: SubTab) => void;
  pendingCount: number;
}

const TABS: SubTab[] = ['validation', 'historique'];

export function TabSwitcher({ tab: activeTab, onChange, pendingCount }: TabSwitcherProps) {
  return (
    <div className="rounded-t-xl border border-b-0 border-separator bg-surface">
      <div className="flex border-b border-separator">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors capitalize ${
              activeTab === tab ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {tab === 'validation' ? <Clock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            {tab === 'validation' ? `Validation (${pendingCount})` : 'Historique'}
          </button>
        ))}
      </div>
    </div>
  );
}
