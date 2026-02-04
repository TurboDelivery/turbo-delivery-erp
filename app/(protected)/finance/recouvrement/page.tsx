import RecouvrementGraphs from '@/feature-finance/revenus/components/recouvrement/recouvrement';
import RecouvrementContentTabs from '@/components/finance/recouvrements/recouvrement-content-tabs';

export default function RecouvrementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <RecouvrementGraphs />
      <RecouvrementContentTabs />
    </div>
  );
}
