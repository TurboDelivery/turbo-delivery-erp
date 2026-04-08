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
    <div className="rounded-t-xl border border-b-0 border-gray-200 bg-white">
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors capitalize ${
              activeTab === tab ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
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
