import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  DEFAULT_PATIENT_PARAMS,
  REFERENCE_SCENARIOS,
  calibrateFromBiomarkers,
  classifyBarrierState,
  computeDoseResponseSweep,
  runConfigSimulation,
} from '../simulation/gutBarrierOde.ts';
import type {
  PatientBarrierParams,
  SimulationConfig,
} from '../simulation/gutBarrierOde.ts';

const RESEARCH_DISCLAIMER =
  'RESEARCH USE ONLY: In silico mechanistic ODE simulation outputs are not clinically validated and do not constitute medical advice, diagnosis, or treatment recommendations.';

export const SimulateGutBarrierInputShape = {
  butyrate_mM: z
    .number()
    .min(0)
    .max(50)
    .default(2.0)
    .describe('Luminal butyrate concentration in mM (0-50 mM).'),
  propionate_mM: z
    .number()
    .min(0)
    .max(50)
    .default(0)
    .describe('Luminal propionate concentration in mM (multi-metabolite mode).'),
  acetate_mM: z
    .number()
    .min(0)
    .max(100)
    .default(0)
    .describe('Luminal acetate concentration in mM (multi-metabolite mode).'),
  ipa_mM: z
    .number()
    .min(0)
    .max(20)
    .default(0)
    .describe('Luminal indole-3-propionate (AhR agonist) concentration in mM.'),
  metabolite_profile: z
    .enum(['constant', 'postprandial', 'bolus'])
    .default('constant')
    .describe('Temporal metabolite supply profile.'),
  inflammation_input: z
    .number()
    .min(0)
    .max(1.0)
    .default(0)
    .describe('Exogenous inflammatory stimulus S_inf (h^-1). 0.10 = moderate LPS/TNF-alpha challenge.'),
  inflammation_profile: z
    .enum(['constant', 'lps_challenge'])
    .default('constant')
    .describe('Constant chronic stress or acute LPS challenge starting at t = 4 h.'),
  mucus_attenuation: z
    .number()
    .min(0.05)
    .max(1.0)
    .default(1.0)
    .describe('Mucus diffusion factor f_mucus (1.0 = Caco-2 in vitro, 0.25 = healthy human colon in vivo).'),
  duration_h: z
    .number()
    .min(1)
    .max(168)
    .default(48)
    .describe('Simulation time horizon in hours (default 48 h).'),
  include_timeseries: z
    .boolean()
    .default(false)
    .describe('If true, returns full time-series arrays in addition to final snapshot.'),
  params_override: z
    .record(z.string(), z.number())
    .optional()
    .describe('Optional partial override of PatientBarrierParams keys.'),
};

export const SimulateGutBarrierSchema = z.object(SimulateGutBarrierInputShape);

export const DoseResponseInputShape = {
  mucus_attenuation: z
    .number()
    .min(0.05)
    .max(1.0)
    .default(1.0)
    .describe('Mucus diffusion factor f_mucus (1.0 = Caco-2 in vitro, 0.25 = healthy human colon).'),
  inflammation_input: z
    .number()
    .min(0)
    .max(1.0)
    .default(0)
    .describe('Exogenous inflammatory stimulus S_inf (h^-1).'),
  duration_h: z
    .number()
    .min(1)
    .max(168)
    .default(48)
    .describe('Evaluation time horizon in hours.'),
  max_dose_mM: z
    .number()
    .min(2)
    .max(50)
    .default(12)
    .describe('Upper luminal butyrate dose bound in mM (default 12 mM).'),
  steps: z
    .number()
    .int()
    .min(4)
    .max(120)
    .default(48)
    .describe('Number of discrete concentration steps across [0, max_dose_mM].'),
};

export const DoseResponseSchema = z.object(DoseResponseInputShape);

export const CalibrateBiomarkersInputShape = {
  fecal_calprotectin_ug_g: z
    .number()
    .min(0)
    .max(5000)
    .default(30)
    .describe('Fecal calprotectin concentration in ug/g (<50 normal, >=250 active flare).'),
  baseline_lm_ratio: z
    .number()
    .min(0.005)
    .max(0.25)
    .optional()
    .describe('Baseline clinical Lactulose/Mannitol urinary excretion ratio (healthy ~0.025).'),
  serum_lbp_ug_ml: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Serum LPS-binding protein in ug/mL (normal ~5-10 ug/mL).'),
  mucus_state: z
    .enum(['in_vitro', 'healthy_in_vivo', 'degraded_ibd'])
    .default('healthy_in_vivo')
    .describe('Mucosal barrier state preset.'),
  test_butyrate_mM: z
    .number()
    .min(0)
    .max(50)
    .optional()
    .describe('Optional candidate luminal butyrate dose (mM) to simulate after patient calibration.'),
  duration_h: z
    .number()
    .min(1)
    .max(168)
    .default(48)
    .describe('Simulation duration in hours if test_butyrate_mM is provided.'),
};

export const CalibrateBiomarkersSchema = z.object(CalibrateBiomarkersInputShape);

export function executeSimulateGutBarrier(
  rawInput: z.infer<typeof SimulateGutBarrierSchema>
) {
  const input = SimulateGutBarrierSchema.parse(rawInput);
  const useMulti =
    input.propionate_mM > 0 || input.acetate_mM > 0 || input.ipa_mM > 0;

  const params: PatientBarrierParams = {
    ...DEFAULT_PATIENT_PARAMS,
    ...(input.params_override as Partial<PatientBarrierParams> | undefined),
    mucus_attenuation: input.mucus_attenuation,
  };

  const config: SimulationConfig = {
    id: 'agent_run',
    label: 'Agent Simulation',
    description: 'Mechanistic ODE simulation invoked via API/MCP tool.',
    mode: useMulti ? 'multi' : 'single',
    metabolites: {
      butyrate_mM: input.butyrate_mM,
      propionate_mM: input.propionate_mM,
      acetate_mM: input.acetate_mM,
      ipa_mM: input.ipa_mM,
    },
    metaboliteProfile: input.metabolite_profile,
    inflammation_input: input.inflammation_input,
    inflammationProfile: input.inflammation_profile,
    duration_h: input.duration_h,
    params,
  };

  const result = runConfigSimulation(config);
  const s = result.final_snapshot;
  const status = classifyBarrierState(s.lactulose_mannitol_ratio, s.cell_viability);

  return {
    disclaimer: RESEARCH_DISCLAIMER,
    status_code: status.code,
    leaky_gut_alert: s.lactulose_mannitol_ratio > 0.05,
    apoptotic_alert: s.cell_viability < 0.85,
    final_snapshot: s,
    ...(input.include_timeseries
      ? {
          time_h: result.time_h,
          states: result.states,
          permeability_timeseries: result.permeability_timeseries,
        }
      : {}),
  };
}

export function executeDoseResponseSweep(
  rawInput: z.infer<typeof DoseResponseSchema>
) {
  const input = DoseResponseSchema.parse(rawInput);
  const params: PatientBarrierParams = {
    ...DEFAULT_PATIENT_PARAMS,
    mucus_attenuation: input.mucus_attenuation,
  };

  const curve = computeDoseResponseSweep(
    params,
    input.inflammation_input,
    input.duration_h,
    input.max_dose_mM,
    input.steps
  );

  const optimal = curve.reduce((best, cur) =>
    cur.Papp_FD4_1e6_cm_s < best.Papp_FD4_1e6_cm_s ? cur : best
  );
  const maxTeerPoint = curve.reduce((best, cur) =>
    cur.TEER_ohm_cm2 > best.TEER_ohm_cm2 ? cur : best
  );
  const cytotoxicPoint = curve.find((p) => p.cell_viability < 0.85) ?? null;

  return {
    disclaimer: RESEARCH_DISCLAIMER,
    summary: {
      mucus_attenuation: input.mucus_attenuation,
      inflammation_input: input.inflammation_input,
      duration_h: input.duration_h,
      optimal_dose_mM: optimal.dose_mM,
      min_Papp_FD4_1e6_cm_s: optimal.Papp_FD4_1e6_cm_s,
      max_TEER_ohm_cm2: maxTeerPoint.TEER_ohm_cm2,
      cytotoxic_onset_dose_mM: cytotoxicPoint ? cytotoxicPoint.dose_mM : null,
    },
    curve,
  };
}

export function executeCalibrateFromBiomarkers(
  rawInput: z.infer<typeof CalibrateBiomarkersSchema>
) {
  const input = CalibrateBiomarkersSchema.parse(rawInput);
  const calibration = calibrateFromBiomarkers({
    fecal_calprotectin_ug_g: input.fecal_calprotectin_ug_g,
    baseline_lm_ratio: input.baseline_lm_ratio,
    serum_lbp_ug_ml: input.serum_lbp_ug_ml,
    mucus_state: input.mucus_state,
  });

  let simulatedIntervention = null;
  if (input.test_butyrate_mM !== undefined) {
    const config: SimulationConfig = {
      id: 'calibrated_intervention',
      label: 'Calibrated Patient Intervention',
      description: 'Patient-calibrated ODE simulation.',
      mode: 'single',
      metabolites: {
        butyrate_mM: input.test_butyrate_mM,
        propionate_mM: 0,
        acetate_mM: 0,
        ipa_mM: 0,
      },
      metaboliteProfile: 'constant',
      inflammation_input: calibration.estimated_S_inf_h_inv,
      inflammationProfile: 'constant',
      duration_h: input.duration_h,
      params: calibration.calibrated_params,
    };
    const res = runConfigSimulation(config);
    const status = classifyBarrierState(
      res.final_snapshot.lactulose_mannitol_ratio,
      res.final_snapshot.cell_viability
    );
    simulatedIntervention = {
      butyrate_mM: input.test_butyrate_mM,
      status_code: status.code,
      leaky_gut_alert: res.final_snapshot.lactulose_mannitol_ratio > 0.05,
      final_snapshot: res.final_snapshot,
    };
  }

  return {
    disclaimer: RESEARCH_DISCLAIMER,
    ...calibration,
    simulated_intervention: simulatedIntervention,
  };
}

export function executeListScenarios() {
  return {
    disclaimer: RESEARCH_DISCLAIMER,
    scenarios: REFERENCE_SCENARIOS.map((sc) => {
      const res = runConfigSimulation(sc);
      const status = classifyBarrierState(
        res.final_snapshot.lactulose_mannitol_ratio,
        res.final_snapshot.cell_viability
      );
      return {
        id: sc.id,
        label: sc.label,
        description: sc.description,
        butyrate_mM: sc.metabolites.butyrate_mM,
        inflammation_input: sc.inflammation_input,
        mucus_attenuation: sc.params.mucus_attenuation,
        status_code: status.code,
        final_snapshot_48h: res.final_snapshot,
      };
    }),
  };
}

export function createGutBarrierMcpServer(): McpServer {
  const server = new McpServer({
    name: 'dthp-gut-barrier',
    version: '1.0.0',
  });

  server.registerTool(
    'simulate_gut_barrier',
    {
      title: 'Simulate Gut Barrier Permeability (ODE)',
      description:
        'Runs a deterministic RK4 mechanistic ODE simulation of microbial metabolites (butyrate, propionate, acetate, indole-3-propionate) on intestinal tight junctions, quantifying TEER, Papp FD4, Lactulose/Mannitol ratio, and cell viability.',
      inputSchema: SimulateGutBarrierInputShape,
    },
    async (args) => {
      const output = executeSimulateGutBarrier(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
      };
    }
  );

  server.registerTool(
    'sweep_butyrate_dose_response',
    {
      title: 'Sweep Biphasic Butyrate Dose-Response Curve',
      description:
        'Evaluates the biphasic (hormetic) effect of luminal butyrate across 0..max_dose_mM, returning the optimal barrier-reinforcing dose and the high-dose apoptotic cytotoxicity threshold.',
      inputSchema: DoseResponseInputShape,
    },
    async (args) => {
      const output = executeDoseResponseSweep(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
      };
    }
  );

  server.registerTool(
    'calibrate_from_biomarkers',
    {
      title: 'Calibrate Digital Twin from Patient Biomarkers',
      description:
        'Maps clinical biomarkers (fecal calprotectin, baseline Lactulose/Mannitol ratio, serum LBP, mucosal state) to patient-specific ODE parameters and optionally tests a butyrate intervention.',
      inputSchema: CalibrateBiomarkersInputShape,
    },
    async (args) => {
      const output = executeCalibrateFromBiomarkers(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
      };
    }
  );

  server.registerTool(
    'list_reference_scenarios',
    {
      title: 'List Reference Caco-2 Validation Scenarios',
      description:
        'Returns the 5 benchmark Caco-2 scenarios (healthy basal, 2 mM butyrate, inflammatory challenge, therapeutic rescue, 8 mM paradoxical overload) with 48h simulated snapshots.',
    },
    async () => {
      const output = executeListScenarios();
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
      };
    }
  );

  return server;
}
