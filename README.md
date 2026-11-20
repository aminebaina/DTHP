# DTHP · Gut Barrier MCP Server & Deterministic QSP Simulator

Deterministic 4-ODE mechanistic simulator (4th-order Runge-Kutta, internal `Δt = 0.02 h`) quantifying the impact of microbial metabolites (butyrate, propionate, acetate, indole-3-propionate) on intestinal tight junctions (`ZO-1` / `Occludin`), transepithelial electrical resistance (`TEER`), apparent permeability (`P_app` FITC-Dextran 4 kDa), and clinical Lactulose/Mannitol (`L/M`) ratio.

> **Research Use Only:** In silico simulation outputs are for scientific research and educational purposes only. They are not clinically validated and do not constitute medical advice, diagnosis, or treatment recommendations.

## Exposed MCP Tools (`mcp-server.ts` & `POST /mcp`)

1. `simulate_gut_barrier` — Runs the coupled 4-ODE barrier model for single-metabolite or SCFA/AhR cocktail inputs, returning `final_snapshot`, `status_code`, and `leaky_gut_alert`.
2. `sweep_butyrate_dose_response` — Sweeps luminal butyrate across `0..max_dose_mM` to identify the optimal barrier-reinforcing window and high-dose apoptotic cytotoxicity threshold.
3. `calibrate_from_biomarkers` — Maps fecal calprotectin, baseline `L/M` ratio, serum LBP, and mucosal integrity into patient-specific ODE parameters and tests an intervention.
4. `list_reference_scenarios` — Returns the 5 benchmark Caco-2 validation scenarios at `t = 48 h`.

## Quick Start

### 1. Run Full-Stack Web UI + REST API + Streamable HTTP MCP (port 3000)
```bash
npm run dev
```
- Web UI: `http://localhost:3000` (`?lang=en` or `?lang=fr`)
- Streamable HTTP MCP endpoint: `POST http://localhost:3000/mcp`
- REST endpoints: `POST /api/simulate`, `POST /api/dose-response`, `POST /api/calibrate`, `GET /api/scenarios`, `GET /api/health`

### 2. Run Standalone Stdio MCP Server (Claude Desktop / Gemini CLI / Cursor)
```json
{
  "mcpServers": {
    "dthp-gut-barrier": {
      "command": "npx",
      "args": ["tsx", "mcp-server.ts"]
    }
  }
}
```

### 3. Run Numerical Non-Regression Tests
```bash
npm test
```
