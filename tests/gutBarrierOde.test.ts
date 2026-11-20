import test from 'node:test';
import assert from 'node:assert/strict';
import {
  executeCalibrateFromBiomarkers,
  executeDoseResponseSweep,
  executeSimulateGutBarrier,
} from '../src/mcp/tools.ts';

test('Scenario 1: Basal healthy state maintains TEER ~450.5 and Papp 0.60', () => {
  const res = executeSimulateGutBarrier({
    butyrate_mM: 0,
    propionate_mM: 0,
    acetate_mM: 0,
    ipa_mM: 0,
    metabolite_profile: 'constant',
    inflammation_input: 0,
    inflammation_profile: 'constant',
    mucus_attenuation: 1.0,
    duration_h: 48,
    include_timeseries: false,
  });

  assert.equal(res.status_code, 'INTACT');
  assert.equal(res.leaky_gut_alert, false);
  assert.ok(Math.abs(res.final_snapshot.TEER_ohm_cm2 - 450.45) < 0.5);
  assert.ok(Math.abs(res.final_snapshot.Papp_FD4_1e6_cm_s - 0.6) < 0.01);
  assert.ok(Math.abs(res.final_snapshot.lactulose_mannitol_ratio - 0.025) < 0.001);
});

test('Scenario 2: Physiological butyrate (2 mM) reinforces tight junctions', () => {
  const res = executeSimulateGutBarrier({
    butyrate_mM: 2.0,
    propionate_mM: 0,
    acetate_mM: 0,
    ipa_mM: 0,
    metabolite_profile: 'constant',
    inflammation_input: 0,
    inflammation_profile: 'constant',
    mucus_attenuation: 1.0,
    duration_h: 48,
    include_timeseries: false,
  });

  assert.equal(res.status_code, 'REINFORCED');
  assert.ok(res.final_snapshot.TEER_ohm_cm2 > 670);
  assert.ok(res.final_snapshot.Papp_FD4_1e6_cm_s < 0.36);
  assert.ok(res.final_snapshot.lactulose_mannitol_ratio < 0.016);
});

test('Scenario 3 & 4: Inflammatory challenge triggers Leaky Gut and 2 mM butyrate rescues it', () => {
  const challenge = executeSimulateGutBarrier({
    butyrate_mM: 0,
    propionate_mM: 0,
    acetate_mM: 0,
    ipa_mM: 0,
    metabolite_profile: 'constant',
    inflammation_input: 0.1,
    inflammation_profile: 'constant',
    mucus_attenuation: 1.0,
    duration_h: 48,
    include_timeseries: false,
  });
  assert.equal(challenge.status_code, 'LEAKY_GUT');
  assert.equal(challenge.leaky_gut_alert, true);
  assert.ok(challenge.final_snapshot.lactulose_mannitol_ratio > 0.05);

  const rescue = executeSimulateGutBarrier({
    butyrate_mM: 2.0,
    propionate_mM: 0,
    acetate_mM: 0,
    ipa_mM: 0,
    metabolite_profile: 'constant',
    inflammation_input: 0.1,
    inflammation_profile: 'constant',
    mucus_attenuation: 1.0,
    duration_h: 48,
    include_timeseries: false,
  });
  assert.equal(rescue.status_code, 'REINFORCED');
  assert.equal(rescue.leaky_gut_alert, false);
  assert.ok(rescue.final_snapshot.lactulose_mannitol_ratio < 0.02);
});

test('Scenario 5: Paradoxical 8 mM direct overload causes apoptotic rupture', () => {
  const overload = executeSimulateGutBarrier({
    butyrate_mM: 8.0,
    propionate_mM: 0,
    acetate_mM: 0,
    ipa_mM: 0,
    metabolite_profile: 'constant',
    inflammation_input: 0,
    inflammation_profile: 'constant',
    mucus_attenuation: 1.0,
    duration_h: 48,
    include_timeseries: false,
  });

  assert.equal(overload.status_code, 'APOPTOTIC_RUPTURE');
  assert.equal(overload.apoptotic_alert, true);
  assert.ok(overload.final_snapshot.cell_viability < 0.55);
  assert.ok(overload.final_snapshot.Papp_FD4_1e6_cm_s > 4.0);
});

test('Biphasic dose-response sweep and biomarker calibration produce valid clinical bounds', () => {
  const sweepInVitro = executeDoseResponseSweep({
    mucus_attenuation: 1.0,
    inflammation_input: 0,
    duration_h: 48,
    max_dose_mM: 12,
    steps: 48,
  });
  assert.equal(sweepInVitro.summary.optimal_dose_mM, 1.75);
  assert.equal(sweepInVitro.summary.cytotoxic_onset_dose_mM, 5.75);

  const sweepInVivo = executeDoseResponseSweep({
    mucus_attenuation: 0.25,
    inflammation_input: 0,
    duration_h: 48,
    max_dose_mM: 24,
    steps: 48,
  });
  assert.equal(sweepInVivo.summary.optimal_dose_mM, 7);
  assert.equal(sweepInVivo.summary.cytotoxic_onset_dose_mM, 22.5);

  const cal = executeCalibrateFromBiomarkers({
    fecal_calprotectin_ug_g: 300,
    baseline_lm_ratio: 0.035,
    serum_lbp_ug_ml: 20,
    mucus_state: 'degraded_ibd',
    test_butyrate_mM: 3.0,
    duration_h: 48,
  });
  assert.equal(cal.estimated_S_inf_h_inv, 0.12);
  assert.ok(cal.simulated_intervention !== null);
  assert.equal(cal.simulated_intervention?.leaky_gut_alert, false);
});
