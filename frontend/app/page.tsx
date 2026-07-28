"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

const GraphVisualizer = dynamic(() => import("@/components/GraphVisualizer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-cyan-400 font-mono text-sm tracking-widest">
      INITIALIZING TRUST RAILS...
    </div>
  ),
});

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState<any>(null);
  
  // State for UAT Filter Logic
  const [filterType, setFilterType] = useState<string>("");

  // State for Revocation Simulation
  const [simulating, setSimulating] = useState(false);
  const [revokeImpact, setRevokeImpact] = useState<any>(null);

  // Reset revocation impact when switching nodes
  useEffect(() => {
    setRevokeImpact(null);
  }, [activeNode]);

  useEffect(() => {
    const fetchIntelligence = async () => {
      try {
        setLoading(true);
        // Ping backend with active filters
        const queryParams = new URLSearchParams();
        if (filterType) queryParams.append("node_type", filterType);
        
        const res = await fetch(`http://127.0.0.1:8000/api/v1/intelligence?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        
        const payload = await res.json();
        setData(payload);
        setActiveNode(null); // Reset sidebar on new fetch
      } catch (err) {
        console.error("Failed to fetch intelligence data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIntelligence();
  }, [filterType]);

  // Feature: Handle Revoke Access Simulation
  const handleActionClick = async () => {
    if (!activeNode) return;

    setSimulating(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/simulate-revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target_node_id: activeNode.id }),
      });

      if (!res.ok) throw new Error("Failed to simulate revocation");
      const result = await res.json();
      setRevokeImpact(result);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  // Feature: Export Graph State to JSON
  const handleDownloadSample = () => {
    if (!data?.visualization) return;
    
    const dataStr = JSON.stringify(data.visualization, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = "financial_data_broker_map_export.json";
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Risk Data Calculation for Recharts
  const riskData = useMemo(() => {
    if (!data?.visualization?.nodes) return [];
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    
    data.visualization.nodes.forEach((n: any) => {
      const risk = n.risk_level?.toLowerCase();
      if (counts[risk as keyof typeof counts] !== undefined) {
        counts[risk as keyof typeof counts]++;
      }
    });

    return [
      { name: "Low Risk", value: counts.low, color: "#38BDF8" },      // Cyan
      { name: "Medium Risk", value: counts.medium, color: "#818CF8" },   // Indigo
      { name: "High Risk", value: counts.high, color: "#F97316" },      // Orange
      { name: "Critical Risk", value: counts.critical, color: "#EF4444" }, // Red
    ].filter(d => d.value > 0);
  }, [data]);

  return (
    <main className="w-screen h-screen overflow-hidden flex bg-[#030712] text-gray-100">
      
      {/* SECTION 1: 70% MAIN STAGE */}
      <section className="w-[70%] h-full relative border-r border-[#1F2937] flex flex-col">
        {/* Floating Filter Bar */}
        <div className="absolute top-4 left-4 z-10 bg-[#0B1117] border border-[#1F2937] p-2 rounded-md flex gap-2 shadow-lg">
          <span className="text-xs font-mono text-gray-400 self-center px-2">FILTER RAIL:</span>
          <select 
            className="bg-[#030712] text-cyan-400 text-xs font-mono p-1 outline-none border border-[#1F2937] rounded"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">ALL ENTITIES</option>
            <option value="bank">BANKS ONLY</option>
            <option value="aggregator">AGGREGATORS ONLY</option>
            <option value="broker">DATA BROKERS ONLY</option>
          </select>
        </div>

        {/* The Graph */}
        <div className="grow relative">
          {!loading && data?.visualization ? (
            <GraphVisualizer 
              initialData={data.visualization} 
              onNodeSelect={setActiveNode} 
            />
          ) : (
            <div className="flex h-full items-center justify-center text-cyan-500 font-mono text-sm">
              SYNCING ORCHESTRATION PAYLOAD...
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: 30% INTELLIGENCE SIDEBAR */}
      <section className="w-[30%] h-full bg-[#0B1117] p-6 flex flex-col gap-6 overflow-y-auto">
        
        {/* Dynamic Header */}
        <div className="border-b border-[#1F2937] pb-4">
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">
            {activeNode ? activeNode.label : (data?.sidebar?.title || "Financial Data Broker Map")}
          </h1>
          <div className="text-cyan-400 font-mono text-sm font-semibold tracking-wide">
            {activeNode 
              ? `COMPLIANCE SCORE: ${activeNode.compliance_score}/100` 
              : (data?.sidebar?.high_level_metric || "AWAITING METRICS")}
          </div>
        </div>

        {/* Dynamic Insight Panels */}
        <div>
          <h2 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">
            {activeNode ? "Entity Category" : "Why This Matters"}
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            {activeNode ? activeNode.category : (data?.sidebar?.insight_a || "No context provided.")}
          </p>
        </div>

        <div>
          <h2 className="text-[10px] uppercase tracking-widest text-indigo-400 mb-2 font-bold">
            {activeNode ? "Data Types Held in Vault" : "Who Controls The Rail"}
          </h2>
          <div className="bg-[#030712] border border-[#1F2937] p-4 rounded-md shadow-inner">
            {activeNode ? (
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                {activeNode.data_types_held?.map((type: string, i: number) => (
                  <li key={i}>{type}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-300 leading-relaxed">
                {data?.sidebar?.insight_b || "No governance data found."}
              </p>
            )}
          </div>
        </div>

        {/* Recharts Analytics Panel - Global View */}
        {!activeNode && riskData.length > 0 && (
          <div>
            <h2 className="text-[10px] uppercase tracking-widest text-cyan-400 mb-2 font-bold">
              Network Risk Exposure
            </h2>
            <div className="bg-[#030712] border border-[#1F2937] p-4 rounded-md shadow-inner h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0B1117] border border-[#1F2937] p-2 rounded-md shadow-lg">
                            <p className="text-xs font-mono text-gray-200">
                              <span style={{ color: payload[0].payload.color }}>■</span> {payload[0].name}: {payload[0].value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Simulated Revocation Impact Panel */}
        {revokeImpact && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-md shadow-inner">
            <h2 className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-bold">
              Simulation Results
            </h2>
            <ul className="text-sm text-gray-300 space-y-2">
              <li><strong>Nodes Affected:</strong> {revokeImpact.affected_nodes_count}</li>
              <li><strong>Apps Disabled:</strong> {revokeImpact.disabled_downstream_apps?.length > 0 ? revokeImpact.disabled_downstream_apps.join(", ") : "None"}</li>
              <li><strong>Risk Reduction:</strong> {revokeImpact.risk_score_reduction}%</li>
              <li><strong>Status:</strong> {revokeImpact.system_status}</li>
            </ul>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-[#1F2937]">
          <button 
            onClick={activeNode ? handleActionClick : handleDownloadSample}
            disabled={simulating}
            className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-400 border border-cyan-500/50 rounded-md font-mono text-xs transition-colors shadow-[0_0_10px_rgba(56,189,248,0.1)]"
          >
            {simulating ? "SIMULATING..." : activeNode ? "REVOKE ACCESS" : "DOWNLOAD SAMPLE DATA"}
          </button>
        </div>

      </section>
    </main>
  );
}