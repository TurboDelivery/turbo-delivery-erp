
import Statistics from "@/feature-finance/dashboard/components/statistics";
import DashboardHeader from "@/components/components-finance/dashboard/header";
import { ChartLineMultiple } from "@/feature-finance/dashboard/components/chart-line-multiple";

export default function Home() {
  return (
    <div >
      <DashboardHeader />
      <Statistics />
      {/* <Repartition /> */}
      {/* <GraphMansuel /> */}
      <div>
        <ChartLineMultiple />
      </div>
    </div>
  );
}
