# DTHP · Gut Barrier MCP Server & Deterministic QSP Simulator

> [!CAUTION]
> **RESEARCH USE ONLY — NO MEDICAL ADVICE — NO WARRANTY / USAGE RECHERCHE UNIQUEMENT — PAS D'AVIS MÉDICAL**
>
> **EN:** This software and all mathematical models, ODE simulations, parameters, API/MCP outputs, and visualizations are provided **strictly for scientific research, theoretical modeling, and educational purposes**. This project is **NOT a certified medical device** (neither FDA-cleared nor CE-marked under EU MDR) and has **NOT been clinically validated**. Nothing in this repository constitutes medical advice, clinical diagnosis, prognosis, or therapeutic/dosing recommendations. **Never** use this software to make clinical or personal health decisions. By downloading, running, or integrating this code, you agree to the full terms in [`DISCLAIMER.md`](./DISCLAIMER.md) and [`LICENSE`](./LICENSE): the software is provided **"AS IS"**, without warranty of any kind, and the authors disclaim all liability for any direct or indirect damages arising from its use.
>
> **FR :** Ce logiciel ainsi que l'ensemble des modèles mathématiques, simulations ODE, paramètres, résultats API/MCP et visualisations sont fournis **exclusivement à des fins de recherche scientifique, de modélisation théorique et d'éducation**. Ce projet n'est **PAS un dispositif médical certifié** (non approuvé FDA ni marqué CE / RDM) et n'est **PAS validé cliniquement**. Aucun résultat ne constitue un avis médical, un diagnostic, ni une recommandation thérapeutique ou posologique. **N'utilisez jamais** cet outil pour prendre des décisions médicales ou de santé. Le logiciel est fourni **« EN L'ÉTAT »**, sans aucune garantie ; voir [`DISCLAIMER.md`](./DISCLAIMER.md) et [`LICENSE`](./LICENSE).

Deterministic 4-ODE mechanistic simulator (4th-order Runge-Kutta, internal `Δt = 0.02 h`) quantifying the impact of microbial metabolites (butyrate, propionate, acetate, indole-3-propionate) on intestinal tight junctions (`ZO-1` / `Occludin`), transepithelial electrical resistance (`TEER`), apparent permeability (`P_app` FITC-Dextran 4 kDa), and clinical Lactulose/Mannitol (`L/M`) ratio.

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

## Legal Disclaimer & License

- Full Legal & Medical Disclaimer (EN / FR): [`DISCLAIMER.md`](./DISCLAIMER.md)
- License & Limitation of Liability: [`LICENSE`](./LICENSE) (MIT License)

