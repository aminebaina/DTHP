export interface PatientBarrierParams {
  // Couche de mucus (1.0 = Caco-2 in vitro ; ~0.25 = colon humain in vivo sain)
  mucus_attenuation: number;

  // Signalisation AMPK / HDACi
  k_on_A: number; // h^-1
  k_off_A: number; // h^-1
  K_A: number; // mM (EC50 assemblage TJ)
  n_A: number;

  // Inflammation & Translocation
  k_clear_I: number; // h^-1
  k_anti_I: number; // h^-1 (capacité anti-inflammatoire du butyrate)
  K_I: number; // mM
  n_I: number;
  k_trans: number; // h^-1 (rétroaction leaky gut)

  // Jonctions serrées (TJ)
  TJ_0: number;
  TJ_max: number;
  k_ass: number; // h^-1
  k_dis_0: number; // h^-1
  alpha_AMPK: number; // gain d'assemblage via AMPK
  k_inf: number; // h^-1 (dégradation TJ par inflammation)

  // Viabilité & Cytotoxicité haute dose
  k_prolif: number; // h^-1
  k_apop: number; // h^-1
  K_tox: number; // mM (seuil cytotoxique épithélial direct)
  n_T: number;

  // Paramètres biophysiques (TEER & Papp FD4)
  G_cell: number; // mS/cm^2
  G_TJ_0: number; // mS/cm^2 -> TEER_0 = 1000 / 2.22 = 450.5 Ohm.cm^2
  G_leak: number; // mS/cm^2
  beta_TEER: number;

  P_pore_0: number; // 10^-6 cm/s (FD4 basal sain)
  P_leak: number; // 10^-6 cm/s
  gamma_Papp: number;
  LM_ratio_0: number; // Ratio Lactulose/Mannitol clinique basal
}

export const DEFAULT_PATIENT_PARAMS: PatientBarrierParams = {
  mucus_attenuation: 1.0,
  k_on_A: 0.25,
  k_off_A: 0.08,
  K_A: 1.2,
  n_A: 2.0,
  k_clear_I: 0.15,
  k_anti_I: 0.30,
  K_I: 1.5,
  n_I: 2.0,
  k_trans: 0.01,
  TJ_0: 1.0,
  TJ_max: 1.6,
  k_ass: 0.10,
  k_dis_0: 0.06,
  alpha_AMPK: 1.8,
  k_inf: 0.09,
  k_prolif: 0.03,
  k_apop: 0.045,
  K_tox: 8.0,
  n_T: 5.0,
  G_cell: 0.50,
  G_TJ_0: 1.72,
  G_leak: 8.0,
  beta_TEER: 2.2,
  P_pore_0: 0.60,
  P_leak: 8.0,
  gamma_Papp: 2.5,
  LM_ratio_0: 0.025,
};

export interface PermeabilityMetrics {
  TEER_ohm_cm2: number;
  delta_TEER_pct: number;
  Papp_FD4_1e6_cm_s: number;
  delta_permeability_pct: number;
  lactulose_mannitol_ratio: number;
}

export interface SimulationResult {
  time_h: number[];
  inputs: {
    butyrate_effective_mM: number[];
    inflammation_stimulus: number[];
  };
  states: {
    AMPK_activation: number[];
    inflammation: number[];
    tight_junction_integrity: number[];
    cell_viability: number[];
  };
  permeability_timeseries: {
    TEER_ohm_cm2: number[];
    Papp_FD4_1e6_cm_s: number[];
    delta_permeability_pct: number[];
    delta_TEER_pct: number[];
    lactulose_mannitol_ratio: number[];
  };
  final_snapshot: {
    duration_h: number;
    TJ_integrity: number;
    cell_viability: number;
    AMPK_activation: number;
    inflammation: number;
    TEER_ohm_cm2: number;
    delta_TEER_pct: number;
    Papp_FD4_1e6_cm_s: number;
    delta_permeability_pct: number;
    lactulose_mannitol_ratio: number;
  };
}

export type MetaboliteProfileType = 'constant' | 'postprandial' | 'bolus';
export type InflammationProfileType = 'constant' | 'lps_challenge';

export interface MetaboliteCocktail {
  butyrate_mM: number;
  propionate_mM: number;
  acetate_mM: number;
  ipa_mM: number; // Indole-3-propionate (agoniste AhR)
}

export interface SimulationConfig {
  id: string;
  label: string;
  description: string;
  mode: 'single' | 'multi';
  metabolites: MetaboliteCocktail;
  metaboliteProfile: MetaboliteProfileType;
  inflammation_input: number;
  inflammationProfile: InflammationProfileType;
  duration_h: number;
  params: PatientBarrierParams;
}

export interface DoseResponsePoint {
  dose_mM: number;
  effective_epi_mM: number;
  TJ_integrity: number;
  cell_viability: number;
  TEER_ohm_cm2: number;
  delta_TEER_pct: number;
  Papp_FD4_1e6_cm_s: number;
  delta_permeability_pct: number;
  lactulose_mannitol_ratio: number;
}

export class DigitalTwinGutBarrier {
  public readonly p: PatientBarrierParams;

  constructor(params?: Partial<PatientBarrierParams>) {
    this.p = { ...DEFAULT_PATIENT_PARAMS, ...params };
  }

  private static hill(x: number, K: number, n: number): number {
    if (x <= 0) return 0;
    const xn = Math.pow(x, n);
    return xn / (Math.pow(K, n) + xn);
  }

  public computePermeabilityMetrics(TJ: number, V: number): PermeabilityMetrics {
    const p = this.p;
    const TJ_safe = Math.max(TJ, 0.05);
    const V_safe = Math.min(1.0, Math.max(0.0, V));

    const G_tj = p.G_TJ_0 * Math.exp(-p.beta_TEER * (TJ_safe - p.TJ_0));
    const G_leak = p.G_leak * (1.0 - V_safe);
    const G_tot = p.G_cell + G_tj + G_leak;
    const teer = 1000.0 / G_tot;

    const p_app =
      p.P_pore_0 * Math.pow(p.TJ_0 / TJ_safe, p.gamma_Papp) +
      p.P_leak * (1.0 - V_safe);

    const delta_p_pct = ((p_app - p.P_pore_0) / p.P_pore_0) * 100.0;
    const teer_0 = 1000.0 / (p.G_cell + p.G_TJ_0);
    const delta_teer_pct = ((teer - teer_0) / teer_0) * 100.0;
    const lm_ratio = p.LM_ratio_0 * (p_app / p.P_pore_0);

    return {
      TEER_ohm_cm2: teer,
      delta_TEER_pct: delta_teer_pct,
      Papp_FD4_1e6_cm_s: p_app,
      delta_permeability_pct: delta_p_pct,
      lactulose_mannitol_ratio: lm_ratio,
    };
  }

  private derivatives(
    t: number,
    y: [number, number, number, number],
    butyrateSignalingFn: (t: number) => number,
    scfaToxicityFn: (t: number) => number,
    inflammationFn: (t: number) => number
  ): [number, number, number, number] {
    const [A, I, TJ, V] = y;
    const p = this.p;

    const B_epi = Math.max(0.0, butyrateSignalingFn(t)) * p.mucus_attenuation;
    const B_tox = Math.max(0.0, scfaToxicityFn(t)) * p.mucus_attenuation;
    const S_inf = Math.max(0.0, inflammationFn(t));

    const metrics = this.computePermeabilityMetrics(TJ, V);
    const translocation_drive = Math.max(
      0.0,
      metrics.Papp_FD4_1e6_cm_s / p.P_pore_0 - 1.0
    );

    const h_A = DigitalTwinGutBarrier.hill(B_epi, p.K_A, p.n_A);
    const dA_dt = p.k_on_A * h_A * (1.0 - A) - p.k_off_A * A;

    const h_I = DigitalTwinGutBarrier.hill(B_epi, p.K_I, p.n_I);
    const dI_dt =
      S_inf +
      p.k_trans * translocation_drive -
      (p.k_clear_I + p.k_anti_I * h_I) * I;

    const dTJ_dt =
      p.k_ass * (1.0 + p.alpha_AMPK * A) * (p.TJ_max - TJ) -
      (p.k_dis_0 + p.k_inf * I) * TJ;

    const h_T = DigitalTwinGutBarrier.hill(B_tox, p.K_tox, p.n_T);
    const dV_dt = p.k_prolif * V * (1.0 - V) - p.k_apop * h_T * V;

    return [dA_dt, dI_dt, dTJ_dt, dV_dt];
  }

  public simulate(
    butyrateInput: number | ((t: number) => number),
    inflammationInput: number | ((t: number) => number) = 0.0,
    duration_h = 48.0,
    dt_h = 0.5,
    initialState?: [number, number, number, number],
    scfaToxicityInput?: number | ((t: number) => number)
  ): SimulationResult {
    const bFn =
      typeof butyrateInput === 'function' ? butyrateInput : () => butyrateInput;
    const toxFn =
      scfaToxicityInput !== undefined
        ? typeof scfaToxicityInput === 'function'
          ? scfaToxicityInput
          : () => scfaToxicityInput
        : bFn;
    const infFn =
      typeof inflammationInput === 'function'
        ? inflammationInput
        : () => inflammationInput;

    let state: [number, number, number, number] = initialState
      ? [...initialState]
      : [0.0, 0.0, this.p.TJ_0, 1.0];

    const steps = Math.round(duration_h / dt_h);
    const subSteps = 25; // dt_sub = 0.02 h for dt_h = 0.5 h -> high RK4 precision
    const h = dt_h / subSteps;

    const time_h: number[] = [];
    const bEffSeries: number[] = [];
    const infStimSeries: number[] = [];
    const aSeries: number[] = [];
    const iSeries: number[] = [];
    const tjSeries: number[] = [];
    const vSeries: number[] = [];
    const teerSeries: number[] = [];
    const pappSeries: number[] = [];
    const deltaPSeries: number[] = [];
    const deltaTeerSeries: number[] = [];
    const lmSeries: number[] = [];

    const recordPoint = (t: number, y: [number, number, number, number]) => {
      const m = this.computePermeabilityMetrics(y[2], y[3]);
      time_h.push(Number(t.toFixed(2)));
      bEffSeries.push(Math.max(0, bFn(t)) * this.p.mucus_attenuation);
      infStimSeries.push(Math.max(0, infFn(t)));
      aSeries.push(y[0]);
      iSeries.push(y[1]);
      tjSeries.push(y[2]);
      vSeries.push(y[3]);
      teerSeries.push(m.TEER_ohm_cm2);
      pappSeries.push(m.Papp_FD4_1e6_cm_s);
      deltaPSeries.push(m.delta_permeability_pct);
      deltaTeerSeries.push(m.delta_TEER_pct);
      lmSeries.push(m.lactulose_mannitol_ratio);
    };

    recordPoint(0, state);

    for (let step = 0; step < steps; step++) {
      let t = step * dt_h;
      for (let sub = 0; sub < subSteps; sub++) {
        const k1 = this.derivatives(t, state, bFn, toxFn, infFn);
        const y2: [number, number, number, number] = [
          state[0] + 0.5 * h * k1[0],
          state[1] + 0.5 * h * k1[1],
          state[2] + 0.5 * h * k1[2],
          state[3] + 0.5 * h * k1[3],
        ];
        const k2 = this.derivatives(t + 0.5 * h, y2, bFn, toxFn, infFn);
        const y3: [number, number, number, number] = [
          state[0] + 0.5 * h * k2[0],
          state[1] + 0.5 * h * k2[1],
          state[2] + 0.5 * h * k2[2],
          state[3] + 0.5 * h * k2[3],
        ];
        const k3 = this.derivatives(t + 0.5 * h, y3, bFn, toxFn, infFn);
        const y4: [number, number, number, number] = [
          state[0] + h * k3[0],
          state[1] + h * k3[1],
          state[2] + h * k3[2],
          state[3] + h * k3[3],
        ];
        const k4 = this.derivatives(t + h, y4, bFn, toxFn, infFn);

        state = [
          Math.min(1.0, Math.max(0.0, state[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]))),
          Math.max(0.0, state[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])),
          Math.min(this.p.TJ_max, Math.max(0.01, state[2] + (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]))),
          Math.min(1.0, Math.max(0.0, state[3] + (h / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]))),
        ];
        t += h;
      }
      recordPoint((step + 1) * dt_h, state);
    }

    const lastIdx = time_h.length - 1;
    const finalMetrics = this.computePermeabilityMetrics(
      tjSeries[lastIdx],
      vSeries[lastIdx]
    );

    return {
      time_h,
      inputs: {
        butyrate_effective_mM: bEffSeries,
        inflammation_stimulus: infStimSeries,
      },
      states: {
        AMPK_activation: aSeries,
        inflammation: iSeries,
        tight_junction_integrity: tjSeries,
        cell_viability: vSeries,
      },
      permeability_timeseries: {
        TEER_ohm_cm2: teerSeries,
        Papp_FD4_1e6_cm_s: pappSeries,
        delta_permeability_pct: deltaPSeries,
        delta_TEER_pct: deltaTeerSeries,
        lactulose_mannitol_ratio: lmSeries,
      },
      final_snapshot: {
        duration_h,
        TJ_integrity: Number(tjSeries[lastIdx].toFixed(4)),
        cell_viability: Number(vSeries[lastIdx].toFixed(4)),
        AMPK_activation: Number(aSeries[lastIdx].toFixed(4)),
        inflammation: Number(iSeries[lastIdx].toFixed(4)),
        TEER_ohm_cm2: Number(finalMetrics.TEER_ohm_cm2.toFixed(4)),
        delta_TEER_pct: Number(finalMetrics.delta_TEER_pct.toFixed(4)),
        Papp_FD4_1e6_cm_s: Number(finalMetrics.Papp_FD4_1e6_cm_s.toFixed(4)),
        delta_permeability_pct: Number(finalMetrics.delta_permeability_pct.toFixed(4)),
        lactulose_mannitol_ratio: Number(finalMetrics.lactulose_mannitol_ratio.toFixed(4)),
      },
    };
  }
}

export function buildMetaboliteFunctions(config: SimulationConfig): {
  signalingFn: (t: number) => number;
  toxicityFn: (t: number) => number;
  inflammationFn: (t: number) => number;
} {
  const { mode, metabolites, metaboliteProfile, inflammation_input, inflammationProfile } = config;

  // Pondération pharmacodynamique (récepteurs GPR41/43/109A, HDACi, AhR)
  const baseSignaling =
    mode === 'single'
      ? metabolites.butyrate_mM
      : metabolites.butyrate_mM * 1.0 +
        metabolites.propionate_mM * 0.45 +
        metabolites.acetate_mM * 0.15 +
        metabolites.ipa_mM * 0.65;

  // Toxicité épithéliale directe liée aux AGCC protonophores (principalement butyrate & propionate à forte dose)
  const baseToxicity =
    mode === 'single'
      ? metabolites.butyrate_mM
      : metabolites.butyrate_mM * 1.0 +
        metabolites.propionate_mM * 0.55 +
        metabolites.acetate_mM * 0.20;

  const profileFactor = (t: number): number => {
    if (metaboliteProfile === 'constant') return 1.0;
    if (metaboliteProfile === 'postprandial') {
      // Fermentation colique post-prandiale (pics toutes les 8h sur un socle basal de 45%)
      const mod = t % 24;
      const peak1 = Math.exp(-Math.pow((mod - 4.0) / 2.2, 2));
      const peak2 = Math.exp(-Math.pow((mod - 11.0) / 2.2, 2));
      const peak3 = Math.exp(-Math.pow((mod - 18.0) / 2.5, 2));
      return 0.45 + 0.95 * (peak1 + peak2 + peak3);
    }
    // Bolus thérapeutique administré à t = 6h avec clairance (t1/2 ~ 8h)
    if (t < 6.0) return 0.15;
    return 0.15 + 1.45 * Math.exp(-0.085 * (t - 6.0));
  };

  const signalingFn = (t: number) => baseSignaling * profileFactor(t);
  const toxicityFn = (t: number) => baseToxicity * profileFactor(t);

  const inflammationFn = (t: number) => {
    if (inflammationProfile === 'constant') return inflammation_input;
    // Challenge LPS aigu à t = 4h
    return t >= 4.0 ? inflammation_input : 0.0;
  };

  return { signalingFn, toxicityFn, inflammationFn };
}

export function runConfigSimulation(config: SimulationConfig): SimulationResult {
  const twin = new DigitalTwinGutBarrier(config.params);
  const { signalingFn, toxicityFn, inflammationFn } = buildMetaboliteFunctions(config);
  return twin.simulate(
    signalingFn,
    inflammationFn,
    config.duration_h,
    0.5,
    undefined,
    toxicityFn
  );
}

export function computeDoseResponseSweep(
  params: PatientBarrierParams,
  inflammationInput = 0,
  duration_h = 48,
  maxDose = 12,
  steps = 48
): DoseResponsePoint[] {
  const twin = new DigitalTwinGutBarrier(params);
  const points: DoseResponsePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const dose = (maxDose * i) / steps;
    const res = twin.simulate(dose, inflammationInput, duration_h, 0.5);
    const s = res.final_snapshot;
    points.push({
      dose_mM: Number(dose.toFixed(2)),
      effective_epi_mM: Number((dose * params.mucus_attenuation).toFixed(2)),
      TJ_integrity: s.TJ_integrity,
      cell_viability: s.cell_viability,
      TEER_ohm_cm2: s.TEER_ohm_cm2,
      delta_TEER_pct: s.delta_TEER_pct,
      Papp_FD4_1e6_cm_s: s.Papp_FD4_1e6_cm_s,
      delta_permeability_pct: s.delta_permeability_pct,
      lactulose_mannitol_ratio: s.lactulose_mannitol_ratio,
    });
  }
  return points;
}

export type BarrierStatusCode =
  | 'APOPTOTIC_RUPTURE'
  | 'LEAKY_GUT'
  | 'ELEVATED_PERMEABILITY'
  | 'REINFORCED'
  | 'INTACT';

export type BarrierStatusI18nKey =
  | 'apoptotic'
  | 'leakyGut'
  | 'elevated'
  | 'reinforced'
  | 'intact';

export interface BarrierStatusInfo {
  code: BarrierStatusCode;
  glyph: string;
  tone: 'nominal' | 'warning' | 'critical';
  i18nKey: BarrierStatusI18nKey;
}

export function classifyBarrierState(
  lmRatio: number,
  viability: number
): BarrierStatusInfo {
  if (viability < 0.85) {
    return {
      code: 'APOPTOTIC_RUPTURE',
      glyph: '✖',
      tone: 'critical',
      i18nKey: 'apoptotic',
    };
  }
  if (lmRatio > 0.05) {
    return {
      code: 'LEAKY_GUT',
      glyph: '✖',
      tone: 'critical',
      i18nKey: 'leakyGut',
    };
  }
  if (lmRatio > 0.032) {
    return {
      code: 'ELEVATED_PERMEABILITY',
      glyph: '▲',
      tone: 'warning',
      i18nKey: 'elevated',
    };
  }
  if (lmRatio < 0.02) {
    return {
      code: 'REINFORCED',
      glyph: '●',
      tone: 'nominal',
      i18nKey: 'reinforced',
    };
  }
  return {
    code: 'INTACT',
    glyph: '●',
    tone: 'nominal',
    i18nKey: 'intact',
  };
}

export interface BiomarkerCalibrationInput {
  fecal_calprotectin_ug_g?: number;
  baseline_lm_ratio?: number;
  serum_lbp_ug_ml?: number;
  mucus_state?: 'in_vitro' | 'healthy_in_vivo' | 'degraded_ibd';
}

export interface BiomarkerCalibrationOutput {
  calibrated_params: PatientBarrierParams;
  estimated_S_inf_h_inv: number;
  calibration_notes: string[];
}

export function calibrateFromBiomarkers(
  input: BiomarkerCalibrationInput
): BiomarkerCalibrationOutput {
  const params: PatientBarrierParams = { ...DEFAULT_PATIENT_PARAMS };
  const notes: string[] = [];

  const mucusState = input.mucus_state ?? 'healthy_in_vivo';
  if (mucusState === 'in_vitro') {
    params.mucus_attenuation = 1.0;
    notes.push('In vitro Caco-2 monolayer: mucus_attenuation = 1.00');
  } else if (mucusState === 'degraded_ibd') {
    params.mucus_attenuation = 0.6;
    notes.push('Degraded mucosal layer (IBD profile): mucus_attenuation = 0.60');
  } else {
    params.mucus_attenuation = 0.25;
    notes.push('Healthy human colonic mucus layer: mucus_attenuation = 0.25');
  }

  // Calprotectin mapping (normal < 50 ug/g, active flare >= 250 ug/g) -> S_inf in [0, 0.22]
  const calpro = Math.max(0, input.fecal_calprotectin_ug_g ?? 30);
  const estimatedSInf =
    calpro <= 50
      ? 0.0
      : Math.min(0.22, Number((((calpro - 50) / 250) * 0.12).toFixed(4)));
  notes.push(`Fecal calprotectin (${calpro} ug/g) -> S_inf = ${estimatedSInf} h^-1`);

  // Baseline L/M ratio calibration (healthy = 0.025 -> P_pore_0 = 0.60)
  if (input.baseline_lm_ratio !== undefined) {
    const clampedLm = Math.max(0.01, Math.min(0.15, input.baseline_lm_ratio));
    params.LM_ratio_0 = clampedLm;
    params.P_pore_0 = Number((0.6 * (clampedLm / 0.025)).toFixed(4));
    notes.push(
      `Baseline L/M (${clampedLm}) -> P_pore_0 = ${params.P_pore_0} x10^-6 cm/s`
    );
  }

  // Serum LBP / LPS translocation feedback mapping (normal ~5-10 ug/mL, endotoxemia > 15 ug/mL)
  if (input.serum_lbp_ug_ml !== undefined) {
    const lbp = Math.max(0, input.serum_lbp_ug_ml);
    params.k_trans =
      lbp <= 10
        ? 0.01
        : Number(Math.min(0.05, 0.01 + ((lbp - 10) / 20) * 0.03).toFixed(4));
    notes.push(`Serum LBP (${lbp} ug/mL) -> k_trans = ${params.k_trans} h^-1`);
  }

  return {
    calibrated_params: params,
    estimated_S_inf_h_inv: estimatedSInf,
    calibration_notes: notes,
  };
}

export const REFERENCE_SCENARIOS: SimulationConfig[] = [
  {
    id: 'basal_sain',
    label: '1. Basal sain (0 mM)',
    description: 'État épithélial Caco-2 de référence sans supplémentation ni stress inflammatoire.',
    mode: 'single',
    metabolites: { butyrate_mM: 0.0, propionate_mM: 0.0, acetate_mM: 0.0, ipa_mM: 0.0 },
    metaboliteProfile: 'constant',
    inflammation_input: 0.0,
    inflammationProfile: 'constant',
    duration_h: 48,
    params: { ...DEFAULT_PATIENT_PARAMS, mucus_attenuation: 1.0 },
  },
  {
    id: 'butyrate_physio',
    label: '2. Butyrate physiologique (2 mM)',
    description: 'Activation AMPK/PKCβ2 et inhibition HDAC renforçant l’assemblage des jonctions serrées.',
    mode: 'single',
    metabolites: { butyrate_mM: 2.0, propionate_mM: 0.0, acetate_mM: 0.0, ipa_mM: 0.0 },
    metaboliteProfile: 'constant',
    inflammation_input: 0.0,
    inflammationProfile: 'constant',
    duration_h: 48,
    params: { ...DEFAULT_PATIENT_PARAMS, mucus_attenuation: 1.0 },
  },
  {
    id: 'challenge_inflammatoire',
    label: '3. Challenge inflammatoire (S_inf = 0,10)',
    description: 'Stress LPS/TNF-α sans butyrate : désassemblage des jonctions et boucle de translocation.',
    mode: 'single',
    metabolites: { butyrate_mM: 0.0, propionate_mM: 0.0, acetate_mM: 0.0, ipa_mM: 0.0 },
    metaboliteProfile: 'constant',
    inflammation_input: 0.10,
    inflammationProfile: 'constant',
    duration_h: 48,
    params: { ...DEFAULT_PATIENT_PARAMS, mucus_attenuation: 1.0 },
  },
  {
    id: 'sauvetage_therapeutique',
    label: '4. Sauvetage thérapeutique (Inflam. + 2 mM)',
    description: 'Le butyrate (2 mM) neutralise l’inflammation NF-κB et restaure le ratio L/M sous 0,05.',
    mode: 'single',
    metabolites: { butyrate_mM: 2.0, propionate_mM: 0.0, acetate_mM: 0.0, ipa_mM: 0.0 },
    metaboliteProfile: 'constant',
    inflammation_input: 0.10,
    inflammationProfile: 'constant',
    duration_h: 48,
    params: { ...DEFAULT_PATIENT_PARAMS, mucus_attenuation: 1.0 },
  },
  {
    id: 'surcharge_paradoxale',
    label: '5. Surcharge paradoxale (8 mM direct)',
    description: 'Effet biphasique : sans tampon muqueux (f_mucus = 1,0), 8 mM induit l’apoptose épithéliale.',
    mode: 'single',
    metabolites: { butyrate_mM: 8.0, propionate_mM: 0.0, acetate_mM: 0.0, ipa_mM: 0.0 },
    metaboliteProfile: 'constant',
    inflammation_input: 0.0,
    inflammationProfile: 'constant',
    duration_h: 48,
    params: { ...DEFAULT_PATIENT_PARAMS, mucus_attenuation: 1.0 },
  },
];

export const PATIENT_CALIBRATION_PRESETS: {
  id: string;
  label: string;
  mucus_attenuation: number;
  P_pore_0: number;
  k_trans: number;
  summary: string;
}[] = [
  {
    id: 'in_vitro_caco2',
    label: 'Modèle In Vitro Caco-2',
    mucus_attenuation: 1.0,
    P_pore_0: 0.60,
    k_trans: 0.01,
    summary: 'Monocouche sans mucus (f_mucus = 1,00) · Calibrage expérimental direct',
  },
  {
    id: 'in_vivo_sain',
    label: 'Patient In Vivo Sain',
    mucus_attenuation: 0.25,
    P_pore_0: 0.60,
    k_trans: 0.008,
    summary: 'Couche de mucus intacte (f_mucus = 0,25) · Colonocytes protégés jusqu’à 20 mM luminal',
  },
  {
    id: 'in_vivo_colite',
    label: 'Patient MICI / Mucus Dégradé',
    mucus_attenuation: 0.60,
    P_pore_0: 0.85,
    k_trans: 0.025,
    summary: 'Barrière muqueuse amincie (f_mucus = 0,60) · Translocation LPS amplifiée',
  },
];
