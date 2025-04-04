"use client"

import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

export function PieChart({ 
  data, 
  config 
}: { 
  data: Array<{name: string, value: number}>, 
  config: ChartConfig 
}) {
  return (
    <ChartContainer config={config} className="min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label={(entry) => entry.name}
          >
            {data.map((entry, index) => {
              const key = entry.name;
              const color = config[key]?.color || "#8884d8";
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>
          <Tooltip formatter={(value) => [`${value} commits`, 'Commits']} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
