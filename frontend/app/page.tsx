"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

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
  }, [filterType]); // Re-fetch whenever the filter changes

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
              onNodeSelect={setActiveNode} // Wires the handshake 
            />
          ) : (
            <div className="flex h-full items-center justify-center text-cyan-500 font-mono text-sm">
              SYNCING ORCHESTRATION PAYLOAD...
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: 30% INTELLIGENCE SIDEBAR */}
      <section className="w-[30%] h-full bg-[#0B1117] p-6 flex flex-col gap-8 overflow-y-auto">
        
        {/* Dynamic Header: Swaps between general metrics and node specific data */}
        <div className="border-b border-[#1F2937] pb-6">
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

        <div className="mt-auto pt-6 border-t border-[#1F2937]">
          <button className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-md font-mono text-xs transition-colors shadow-[0_0_10px_rgba(56,189,248,0.1)]">
            {activeNode ? "REVOKE ACCESS" : "DOWNLOAD SAMPLE DATA"}
          </button>
        </div>

      </section>
    </main>
  );
}