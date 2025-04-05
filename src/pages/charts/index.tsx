// ? just a typical chart page for testing purposes
"use client"
import { useState } from "react"
import { PieChart } from "@/components/PieChart"
import { type ChartConfig } from "@/components/ui/chart"

export default function ChartsPage() {
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "yearly">("monthly")
  
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
  
  const totalCommits = {
    weekly: chartData.weekly.reduce((sum, item) => sum + item.value, 0),
    monthly: chartData.monthly.reduce((sum, item) => sum + item.value, 0),
    yearly: chartData.yearly.reduce((sum, item) => sum + item.value, 0),
  }

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "1.5rem", 
      padding: "1.5rem", 
      maxWidth: "800px", 
      margin: "0 auto", 
      fontFamily: "Arial" 
    }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          GitLab Commit Analytics
        </h1>
        <p style={{ color: "#666" }}>
          Visualize commit statistics for your team&apos;s GitLab repositories
        </p>
      </div>
      
      {/* Time period selector */}
      <div style={{ 
        display: "flex", 
        gap: "0.5rem", 
        borderBottom: "1px solid #e5e7eb", 
        paddingBottom: "0.5rem" 
      }}>
        {["weekly", "monthly", "yearly"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "weekly" | "monthly" | "yearly")}
            style={{ 
              padding: "0.5rem 1rem", 
              borderRadius: "0.375rem 0.375rem 0 0", 
              border: activeTab === tab ? "1px solid #e5e7eb" : "none", 
              borderBottom: activeTab === tab ? "none" : undefined,
              backgroundColor: activeTab === tab ? "#eff6ff" : "transparent",
              color: activeTab === tab ? "#2563eb" : "#4b5563",
              cursor: "pointer"
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Stats summary */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(3, 1fr)", 
        gap: "1rem" 
      }}>
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#eff6ff", 
          borderRadius: "0.5rem" 
        }}>
          <h3 style={{ 
            fontSize: "0.75rem", 
            textTransform: "uppercase", 
            color: "#1d4ed8", 
            fontWeight: "600", 
            marginBottom: "0.5rem" 
          }}>
            Total Commits
          </h3>
          <p style={{ 
            fontSize: "1.875rem", 
            fontWeight: "bold", 
            color: "#1e3a8a" 
          }}>
            {totalCommits[activeTab]}
          </p>
        </div>
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#eef2ff", 
          borderRadius: "0.5rem" 
        }}>
          <h3 style={{ 
            fontSize: "0.75rem", 
            textTransform: "uppercase", 
            color: "#4f46e5", 
            fontWeight: "600", 
            marginBottom: "0.5rem"
          }}>
            Top Contributor
          </h3>
          <p style={{ 
            fontSize: "1.875rem", 
            fontWeight: "bold", 
            color: "#3730a3" 
          }}>
            {chartData[activeTab][0].name}
          </p>
        </div>
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#ecfdf5", 
          borderRadius: "0.5rem" 
        }}>
          <h3 style={{ 
            fontSize: "0.75rem", 
            textTransform: "uppercase", 
            color: "#047857", 
            fontWeight: "600", 
            marginBottom: "0.5rem"
          }}>
            Team Members
          </h3>
          <p style={{ 
            fontSize: "1.875rem", 
            fontWeight: "bold", 
            color: "#064e3b" 
          }}>
            {chartData[activeTab].length}
          </p>
        </div>
      </div>
      
      {/* Chart visualization */}
      <div style={{ 
        border: "1px solid #e5e7eb", 
        borderRadius: "0.5rem", 
        padding: "1.5rem" 
      }}>
        <h2 style={{ 
          fontSize: "1.25rem", 
          fontWeight: "600", 
          marginBottom: "1rem" 
        }}>
          Commits by Author ({activeTab})
        </h2>
        <div style={{ height: "400px" }}>
          <PieChart 
            data={chartData[activeTab]} 
            config={chartConfig} 
          />
        </div>
      </div>
    </div>
  )
} 