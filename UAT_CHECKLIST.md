# Functional UAT Checklist

| Test Case | Expected Result | Pass/Fail |
| :--- | :--- | :--- |
| **The Handshake** | Clicking a specific node (e.g., Chase Bank or Experian) dynamically updates the 30% intelligence sidebar to display its Compliance Score, Category, and Data Types Held. | Pass |
| **Filter Logic** | Changing the "FILTER RAIL" dropdown triggers an API call with the `node_type` parameter, instantly updating the visualization without a page refresh. | Pass |
| **Intelligence Value** | When no node is active, the sidebar accurately defaults to the mandated Excel insights ("How financial behavior data moves...") and governance summary. | Pass |
| **The Mock Fallback** | The FastAPI backend successfully intercepts the routing and defaults to the robust mock topology, adhering to the 2-Hour Rule. | Pass |
| **Simulate Revocation** | POSTing to the `/api/simulate-revoke` endpoint successfully calculates downstream network impact and renders the alert panel in the UI. | Pass |
| **Data Export** | Clicking "DOWNLOAD SAMPLE DATA" successfully generates and downloads a `.json` file containing the active graph state via the browser Blob API. | Pass |