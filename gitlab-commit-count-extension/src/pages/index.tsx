import { PieChart } from "@/components/pieChart";
import { ChartConfig } from "@/components/ui/chart";


export default function Home() {
  const chartData = {
    weekly: [
      { name: "Alice", value: 32 },
      { name: "Bob", value: 25 },
      { name: "Charlie", value: 18 },
      { name: "David", value: 15 },
      { name: "Eve", value: 10 },
    ],
    monthly: [
      { name: "Alice", value: 120 },
      { name: "Bob", value: 85 },
      { name: "Charlie", value: 65 },
      { name: "David", value: 45 },
      { name: "Eve", value: 30 },
    ],
    yearly: [
      { name: "Alice", value: 520 },
      { name: "Bob", value: 385 },
      { name: "Charlie", value: 290 },
      { name: "David", value: 210 },
      { name: "Eve", value: 150 },
    ]
  }
  const chartConfig: ChartConfig = {
    "Alice": { label: "Alice", color: "#2563eb" },
    "Bob": { label: "Bob", color: "#60a5fa" },
    "Charlie": { label: "Charlie", color: "#93c5fd" },
    "David": { label: "David", color: "#3b82f6" },
    "Eve": { label: "Eve", color: "#1d4ed8" }
  }
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <PieChart data={chartData.weekly} config={chartConfig} />
    </div>
  );
}
