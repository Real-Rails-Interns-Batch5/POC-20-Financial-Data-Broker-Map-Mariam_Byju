from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import networkx as nx
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("data-broker-map")

app = FastAPI(
    title="POC 20: Financial Data Broker Map API",
    description="Backend service providing graph lineage, risk intelligence, and permission revocation simulations.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Data Models (Pydantic Schemas)
# -----------------------------------------------------------------------------

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # 'consumer', 'bank', 'aggregator', 'broker', 'app'
    category: str  # e.g., 'Primary Institution', 'Data Aggregator', 'Credit Bureau', 'Fintech App'
    risk_level: str  # 'low', 'medium', 'high', 'critical'
    compliance_score: int = Field(ge=0, le=100)
    data_types_held: List[str]
    active_consent: bool = True

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    protocol: str  # e.g., 'OAuth 2.0', 'Screen Scraping', 'Direct API', 'Batch SFTP'
    scopes: List[str]  # e.g., ['accounts.read', 'transactions.read', 'identity.verify']
    status: str  # 'active', 'revoked', 'flagged'
    data_volume_daily_kb: int

class GraphDataPayload(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class RedFlagAlert(BaseModel):
    id: str
    node_id: str
    entity_name: str
    severity: str  # 'medium', 'high', 'critical'
    title: str
    description: str
    recommendation: str

class RevokeSimulationRequest(BaseModel):
    target_node_id: Optional[str] = None
    target_edge_id: Optional[str] = None

class RevokeSimulationResponse(BaseModel):
    revoked_node_id: Optional[str]
    revoked_edge_id: Optional[str]
    disabled_downstream_apps: List[str]
    affected_nodes_count: int
    data_types_blocked: List[str]
    risk_score_reduction: float
    system_status: str

class NetworkMetrics(BaseModel):
    total_nodes: int
    total_edges: int
    active_brokers: int
    high_risk_entities: int
    data_exposure_score: float
    connected_apps: int

# --- Real Rails Orchestrator Schemas ---
class SidebarIntelligence(BaseModel):
    title: str
    high_level_metric: str
    insight_a: str
    insight_b: str

class RealRailsPayload(BaseModel):
    sidebar: SidebarIntelligence
    visualization: GraphDataPayload

# -----------------------------------------------------------------------------
# Synthetic Data Engine & Graph Builder
# -----------------------------------------------------------------------------

def build_mock_graph() -> tuple[List[GraphNode], List[GraphEdge], nx.DiGraph]:
    nodes = [
        GraphNode(
            id="user-001",
            label="User Vault (Primary)",
            type="consumer",
            category="User Profile",
            risk_level="low",
            compliance_score=100,
            data_types_held=["Personal Identifiable Info", "Account Credentials"],
            active_consent=True
        ),
        GraphNode(
            id="bank-chase",
            label="Chase Bank",
            type="bank",
            category="Financial Institution",
            risk_level="low",
            compliance_score=98,
            data_types_held=["Checking Balance", "Transaction Ledger", "SSN"],
            active_consent=True
        ),
        GraphNode(
            id="bank-wells",
            label="Wells Fargo",
            type="bank",
            category="Financial Institution",
            risk_level="low",
            compliance_score=95,
            data_types_held=["Mortgage Details", "Savings History"],
            active_consent=True
        ),
        GraphNode(
            id="agg-plaid",
            label="Plaid Pipeline",
            type="aggregator",
            category="API Aggregator",
            risk_level="medium",
            compliance_score=88,
            data_types_held=["Account Tokens", "Raw Transactions", "Identity Metrics"],
            active_consent=True
        ),
        GraphNode(
            id="agg-yodlee",
            label="Envestnet Yodlee",
            type="aggregator",
            category="Legacy Aggregator",
            risk_level="medium",
            compliance_score=82,
            data_types_held=["Investments Data", "Bank Feeds"],
            active_consent=True
        ),
        GraphNode(
            id="broker-experian",
            label="Experian Data Exchange",
            type="broker",
            category="Credit Bureau & Broker",
            risk_level="high",
            compliance_score=72,
            data_types_held=["Credit Scores", "Employment Verification", "Address History"],
            active_consent=True
        ),
        GraphNode(
            id="broker-yodlee-analytics",
            label="Yodlee Data Analytics",
            type="broker",
            category="Data Broker / Reseller",
            risk_level="critical",
            compliance_score=54,
            data_types_held=["Anonymized Transaction Trends", "Merchant Preferences"],
            active_consent=True
        ),
        GraphNode(
            id="app-venmo",
            label="Venmo",
            type="app",
            category="Peer-to-Peer Payments",
            risk_level="low",
            compliance_score=91,
            data_types_held=["Bank Account Routing", "Peer Contacts"],
            active_consent=True
        ),
        GraphNode(
            id="app-mint",
            label="Credit Karma / Mint",
            type="app",
            category="Personal Finance Management",
            risk_level="medium",
            compliance_score=85,
            data_types_held=["Net Worth", "Budget Telemetry"],
            active_consent=True
        ),
        GraphNode(
            id="app-robinhood",
            label="Robinhood",
            type="app",
            category="Investment & Trading",
            risk_level="low",
            compliance_score=90,
            data_types_held=["Brokerage Transfer Tokens"],
            active_consent=True
        )
    ]

    edges = [
        GraphEdge(id="e1", source="user-001", target="bank-chase", protocol="Direct Auth", scopes=["auth"], status="active", data_volume_daily_kb=150),
        GraphEdge(id="e2", source="user-001", target="bank-wells", protocol="Direct Auth", scopes=["auth"], status="active", data_volume_daily_kb=120),
        GraphEdge(id="e3", source="bank-chase", target="agg-plaid", protocol="OAuth 2.0", scopes=["transactions.read", "accounts.read"], status="active", data_volume_daily_kb=850),
        GraphEdge(id="e4", source="bank-wells", target="agg-yodlee", protocol="Screen Scraping", scopes=["full_access"], status="flagged", data_volume_daily_kb=620),
        GraphEdge(id="e5", source="agg-plaid", target="app-venmo", protocol="Direct API", scopes=["balances.read", "transfers.write"], status="active", data_volume_daily_kb=400),
        GraphEdge(id="e6", source="agg-plaid", target="app-mint", protocol="Direct API", scopes=["transactions.read"], status="active", data_volume_daily_kb=550),
        GraphEdge(id="e7", source="agg-yodlee", target="broker-yodlee-analytics", protocol="Batch SFTP", scopes=["anonymized.export"], status="flagged", data_volume_daily_kb=1400),
        GraphEdge(id="e8", source="broker-yodlee-analytics", target="broker-experian", protocol="Data Resale Contract", scopes=["consumer.insights"], status="flagged", data_volume_daily_kb=980),
        GraphEdge(id="e9", source="agg-plaid", target="app-robinhood", protocol="OAuth 2.0", scopes=["investments.read"], status="active", data_volume_daily_kb=310)
    ]

    G = nx.DiGraph()
    for n in nodes:
        G.add_node(n.id, **n.model_dump())
    for e in edges:
        G.add_edge(e.source, e.target, **e.model_dump())

    return nodes, edges, G

# Initialize state
raw_nodes, raw_edges, network_graph = build_mock_graph()

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "online", "system": "POC 20 Financial Data Broker Map Engine"}

@app.get("/api/graph", response_model=GraphDataPayload)
def get_graph_data(
    node_type: Optional[str] = Query(None, description="Filter by node type (bank, aggregator, broker, app)"),
    min_risk: Optional[str] = Query(None, description="Filter by minimum risk level")
):
    """Returns the node and edge adjacency list for React Flow / Cytoscape rendering."""
    filtered_nodes = raw_nodes
    if node_type:
        filtered_nodes = [n for n in filtered_nodes if n.type == node_type]
    
    valid_node_ids = {n.id for n in filtered_nodes}
    filtered_edges = [e for e in raw_edges if e.source in valid_node_ids and e.target in valid_node_ids]
    
    return GraphDataPayload(nodes=filtered_nodes, edges=filtered_edges)

@app.get("/api/metrics", response_model=NetworkMetrics)
def get_metrics():
    """Returns top-level data risk and network telemetry."""
    total_nodes = len(raw_nodes)
    total_edges = len(raw_edges)
    active_brokers = len([n for n in raw_nodes if n.type == "broker"])
    high_risk = len([n for n in raw_nodes if n.risk_level in ["high", "critical"]])
    connected_apps = len([n for n in raw_nodes if n.type == "app"])
    
    # Calculate synthetic exposure score
    avg_compliance = sum(n.compliance_score for n in raw_nodes) / total_nodes if total_nodes > 0 else 100
    exposure_score = round(100 - avg_compliance, 1)

    return NetworkMetrics(
        total_nodes=total_nodes,
        total_edges=total_edges,
        active_brokers=active_brokers,
        high_risk_entities=high_risk,
        data_exposure_score=exposure_score,
        connected_apps=connected_apps
    )

@app.get("/api/red-flags", response_model=List[RedFlagAlert])
def get_red_flags():
    """Identifies risky data paths, screen-scraping endpoints, or unconsented resales."""
    return [
        RedFlagAlert(
            id="rf-001",
            node_id="agg-yodlee",
            entity_name="Envestnet Yodlee",
            severity="critical",
            title="Legacy Screen Scraping Detected",
            description="Accessing Wells Fargo via legacy screen-scraping rather than encrypted OAuth 2.0 tokenization.",
            recommendation="Revoke credential delegation and force OAuth 2.0 migration."
        ),
        RedFlagAlert(
            id="rf-002",
            node_id="broker-yodlee-analytics",
            entity_name="Yodlee Data Analytics",
            severity="high",
            title="Secondary Data Resale Channel",
            description="Exporting batch transaction trends to secondary credit brokers without explicit consent.",
            recommendation="Execute data revocation on broker node 'broker-yodlee-analytics'."
        )
    ]

@app.post("/api/simulate-revoke", response_model=RevokeSimulationResponse)
def simulate_revocation(payload: RevokeSimulationRequest):
    """Calculates downstream app impact when a user revokes access to a broker or aggregator."""
    if not payload.target_node_id and not payload.target_edge_id:
        raise HTTPException(status_code=400, detail="Must provide target_node_id or target_edge_id to simulate revocation.")

    target = payload.target_node_id or payload.target_edge_id
    downstream_apps = []
    affected_nodes = 0
    
    # Analyze downstream cascade using NetworkX
    if payload.target_node_id and network_graph.has_node(payload.target_node_id):
        descendants = nx.descendants(network_graph, payload.target_node_id)
        affected_nodes = len(descendants) + 1
        for node_id in descendants:
            node_data = network_graph.nodes[node_id]
            if node_data.get("type") == "app":
                downstream_apps.append(node_data.get("label", node_id))

    return RevokeSimulationResponse(
        revoked_node_id=payload.target_node_id,
        revoked_edge_id=payload.target_edge_id,
        disabled_downstream_apps=downstream_apps,
        affected_nodes_count=affected_nodes,
        data_types_blocked=["Anonymized Transactions", "Raw Ledger", "Identity Tokens"],
        risk_score_reduction=28.4,
        system_status="SIMULATION_COMPLETE"
    )

# --- Real Rails Orchestrator Endpoint ---
@app.get("/api/v1/intelligence", response_model=RealRailsPayload)
def get_dashboard_intelligence(
    node_type: Optional[str] = Query(None, description="Filter by node type"),
    min_risk: Optional[str] = Query(None, description="Filter by minimum risk level")
):
    """
    Returns the complete orchestration payload required to render
    both the 70% main stage and the 30% intelligence sidebar.
    """
    graph_data = get_graph_data(node_type, min_risk)
    metrics = get_metrics()
    
    sidebar = SidebarIntelligence(
        title="Financial Data Broker Map",
        high_level_metric=f"{metrics.total_edges} Active Contracts | {metrics.data_exposure_score}% Exposure",
        insight_a="How financial behavior data moves across brokers and end users.",
        insight_b="Strong trust rails episode: who gets your data, why, and under what permissions."
    )
    
    return RealRailsPayload(
        sidebar=sidebar,
        visualization=graph_data
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)