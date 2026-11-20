import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, Pause, Play, RotateCcw } from 'lucide-react';
import { Lang, TRANSLATIONS } from './i18n';
import {
  DEFAULT_PATIENT_PARAMS,
  PATIENT_CALIBRATION_PRESETS,
  REFERENCE_SCENARIOS,
  SimulationConfig,
  classifyBarrierState,
  runConfigSimulation,
} from './simulation/gutBarrierOde';
import { EpithelialDiagram } from './components/EpithelialDiagram';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { DoseResponseView } from './components/DoseResponseView';
import { ScenariosView } from './components/ScenariosView';
import { ModelSpecView } from './components/ModelSpecView';

type ActiveTab = 'simulateur' | 'dose_reponse' | 'scenarios' | 'modele';

function getInitialLang(): Lang {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param === 'en' || param === 'fr') return param;
    try {
      const saved = window.localStorage.getItem('dthp_lang');
      if (saved === 'en' || saved === 'fr') return saved;
    } catch {
      // Ignore storage access errors in restricted frames
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    }
  }
  return 'fr';
}

export default function App() {
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulateur');
  const [config, setConfig] = useState<SimulationConfig>(() => ({
    ...REFERENCE_SCENARIOS[1],
    params: { ...DEFAULT_PATIENT_PARAMS },
  }));

  const [activeTimeIndex, setActiveTimeIndex] = useState<number>(96);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.pageTitle;
    try {
      window.localStorage.setItem('dthp_lang', lang);
    } catch {
      // Ignore storage access errors
    }
  }, [lang, t.pageTitle]);

  const handleSetLang = (nextLang: Lang) => {
    setLang(nextLang);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', nextLang);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const result = useMemo(() => runConfigSimulation(config), [config]);
  const safeIndex = Math.min(activeTimeIndex, result.time_h.length - 1);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setActiveTimeIndex((prev) => {
        if (prev >= result.time_h.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 65);
    return () => window.clearInterval(interval);
  }, [isPlaying, result.time_h.length]);

  const handleLoadScenario = (scenario: SimulationConfig) => {
    setIsPlaying(false);
    setConfig({
      ...scenario,
      metabolites: { ...scenario.metabolites },
      params: { ...scenario.params },
    });
    setActiveTimeIndex(Math.round(scenario.duration_h / 0.5));
  };

  const handleApplyCalibration = (presetId: string) => {
    const preset = PATIENT_CALIBRATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setConfig((prev) => ({
      ...prev,
      params: {
        ...prev.params,
        mucus_attenuation: preset.mucus_attenuation,
        P_pore_0: preset.P_pore_0,
        k_trans: preset.k_trans,
      },
    }));
  };

  const handleExportJson = () => {
    const payload = {
      platform: 'Digital Twin Health Platform · Gut Barrier Module',
      disclaimer: t.disclaimer.banner,
      language: lang,
      exported_at: new Date().toISOString(),
      configuration: config,
      simulation: result,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dthp_gut_barrier_${config.id}_${config.duration_h}h.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setConfig({
      ...REFERENCE_SCENARIOS[1],
      params: { ...DEFAULT_PATIENT_PARAMS },
    });
    setActiveTimeIndex(96);
  };

  const currentTeer = result.permeability_timeseries.TEER_ohm_cm2[safeIndex];
  const currentDeltaTeer = result.permeability_timeseries.delta_TEER_pct[safeIndex];
  const currentPapp = result.permeability_timeseries.Papp_FD4_1e6_cm_s[safeIndex];
  const currentDeltaP = result.permeability_timeseries.delta_permeability_pct[safeIndex];
  const currentLM = result.permeability_timeseries.lactulose_mannitol_ratio[safeIndex];
  const currentTJ = result.states.tight_junction_integrity[safeIndex];
  const currentV = result.states.cell_viability[safeIndex];
  const currentAmpk = result.states.AMPK_activation[safeIndex];
  const currentInf = result.states.inflammation[safeIndex];
  const currentButEff = result.inputs.butyrate_effective_mM[safeIndex];
  const currentInfStim = result.inputs.inflammation_stimulus[safeIndex];

  const baselineTeer = 1000.0 / (config.params.G_cell + config.params.G_TJ_0);
  const barrierStatusInfo = classifyBarrierState(currentLM, currentV);
  const barrierStatus = {
    ...barrierStatusInfo,
    ...t.status[barrierStatusInfo.i18nKey],
  };

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'simulateur', label: t.nav.simulateur },
    { id: 'dose_reponse', label: t.nav.dose_reponse },
    { id: 'scenarios', label: t.nav.scenarios },
    { id: 'modele', label: t.nav.modele },
  ];

  const activeCalibrationId =
    PATIENT_CALIBRATION_PRESETS.find(
      (p) =>
        Math.abs(p.mucus_attenuation - config.params.mucus_attenuation) < 0.01 &&
        Math.abs(p.P_pore_0 - config.params.P_pore_0) < 0.01
    )?.id || 'custom';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Exactly 3 zones separated by gap-8 */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('simulateur');
          }}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          {t.brandTitle}
        </a>

        {/* Zone 2: 4 single-line navigation links */}
        <nav className="flex items-center gap-6 overflow-x-auto" aria-label="Navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`text-sm font-medium whitespace-nowrap shrink-0 pb-0.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === item.id
                  ? 'text-slate-900 border-cyan-600'
                  : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-sm hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            {t.exportJson}
          </button>
        </div>
      </header>

      {/* Secondary Workspace Calibration, Preset & Language Ribbon */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-500 mr-1.5">
            {t.ribbon.scenariosLabel}
          </span>
          {REFERENCE_SCENARIOS.map((sc) => {
            const isActive =
              config.id === sc.id &&
              config.mode === 'single' &&
              Math.abs(config.metabolites.butyrate_mM - sc.metabolites.butyrate_mM) < 0.01 &&
              Math.abs(config.inflammation_input - sc.inflammation_input) < 0.005 &&
              Math.abs(config.params.mucus_attenuation - sc.params.mucus_attenuation) < 0.01;
            const scLabel = t.scenarios[sc.id]?.label ?? sc.label;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleLoadScenario(sc)}
                className={`px-2.5 py-1 text-xs rounded-sm border transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {scLabel}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <label htmlFor="patient-preset" className="text-slate-500 whitespace-nowrap">
              {t.ribbon.mucusProfileLabel}
            </label>
            <select
              id="patient-preset"
              value={activeCalibrationId}
              onChange={(e) => handleApplyCalibration(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-sm px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-cyan-600"
            >
              {PATIENT_CALIBRATION_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {t.presets[p.id]?.label ?? p.label}
                </option>
              ))}
              {activeCalibrationId === 'custom' && (
                <option value="custom">{t.ribbon.customCalibration}</option>
              )}
            </select>
          </div>

          <div
            className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded border border-slate-200"
            role="group"
            aria-label={t.ribbon.languageLabel}
          >
            <button
              type="button"
              onClick={() => handleSetLang('fr')}
              className={`px-2 py-0.5 text-[11px] font-mono rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                lang === 'fr'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => handleSetLang('en')}
              className={`px-2 py-0.5 text-[11px] font-mono rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                lang === 'en'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-5 flex flex-col gap-5">
        {/* Clearly visible Research Use Only & Non-Medical-Advice Disclaimer */}
        <div
          role="note"
          aria-label={t.disclaimer.badge}
          className="bg-amber-50/70 border border-amber-300 rounded-md px-4 py-2.5 flex items-start gap-3 text-xs text-amber-950"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            <span className="font-semibold uppercase tracking-wide mr-1.5">
              {t.disclaimer.badge} :
            </span>
            {t.disclaimer.banner}
          </p>
        </div>

        {activeTab === 'simulateur' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Control & Parameter Column */}
            <aside className="lg:col-span-4 xl:col-span-3 bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-sm font-semibold text-slate-900">{t.sidebar.title}</h2>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  {t.sidebar.reset}
                </button>
              </div>

              {/* Section 1: Métabolites */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">
                    {t.sidebar.metabolitesSection}
                  </span>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, mode: 'single' }))}
                      className={`px-2 py-0.5 text-[11px] rounded-xs cursor-pointer whitespace-nowrap ${
                        config.mode === 'single'
                          ? 'bg-white text-slate-900 font-medium shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      {t.sidebar.butyrateMode}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, mode: 'multi' }))}
                      className={`px-2 py-0.5 text-[11px] rounded-xs cursor-pointer whitespace-nowrap ${
                        config.mode === 'multi'
                          ? 'bg-white text-slate-900 font-medium shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      {t.sidebar.cocktailMode}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="sl-butyrate" className="text-slate-600">
                      {t.sidebar.luminalButyrate}
                    </label>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {config.metabolites.butyrate_mM.toFixed(1)} mM
                    </span>
                  </div>
                  <input
                    id="sl-butyrate"
                    type="range"
                    min="0"
                    max="16"
                    step="0.2"
                    value={config.metabolites.butyrate_mM}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        id: 'custom',
                        metabolites: { ...c.metabolites, butyrate_mM: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-full lab-slider"
                  />
                </div>

                {config.mode === 'multi' && (
                  <div className="flex flex-col gap-2.5 pt-1 border-t border-slate-100">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <label htmlFor="sl-propionate" className="text-slate-600">
                          {t.sidebar.propionate}
                        </label>
                        <span className="font-mono tabular-nums text-slate-900">
                          {config.metabolites.propionate_mM.toFixed(1)} mM
                        </span>
                      </div>
                      <input
                        id="sl-propionate"
                        type="range"
                        min="0"
                        max="12"
                        step="0.2"
                        value={config.metabolites.propionate_mM}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            id: 'custom',
                            metabolites: { ...c.metabolites, propionate_mM: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full lab-slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <label htmlFor="sl-acetate" className="text-slate-600">
                          {t.sidebar.acetate}
                        </label>
                        <span className="font-mono tabular-nums text-slate-900">
                          {config.metabolites.acetate_mM.toFixed(1)} mM
                        </span>
                      </div>
                      <input
                        id="sl-acetate"
                        type="range"
                        min="0"
                        max="25"
                        step="0.5"
                        value={config.metabolites.acetate_mM}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            id: 'custom',
                            metabolites: { ...c.metabolites, acetate_mM: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full lab-slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <label htmlFor="sl-ipa" className="text-slate-600">
                          {t.sidebar.ipa}
                        </label>
                        <span className="font-mono tabular-nums text-slate-900">
                          {config.metabolites.ipa_mM.toFixed(2)} mM
                        </span>
                      </div>
                      <input
                        id="sl-ipa"
                        type="range"
                        min="0"
                        max="3"
                        step="0.05"
                        value={config.metabolites.ipa_mM}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            id: 'custom',
                            metabolites: { ...c.metabolites, ipa_mM: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full lab-slider"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="sel-met-prof" className="block text-xs text-slate-600 mb-1">
                    {t.sidebar.supplyKinetics}
                  </label>
                  <select
                    id="sel-met-prof"
                    value={config.metaboliteProfile}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        metaboliteProfile: e.target.value as SimulationConfig['metaboliteProfile'],
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="constant">{t.sidebar.kineticsConstant}</option>
                    <option value="postprandial">{t.sidebar.kineticsPostprandial}</option>
                    <option value="bolus">{t.sidebar.kineticsBolus}</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Inflammation & Translocation */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-800">
                  {t.sidebar.inflammationSection}
                </span>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="sl-sinf" className="text-slate-600">
                      {t.sidebar.stimulusLabel} S<sub>inf</sub> (LPS / TNF-α)
                    </label>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {config.inflammation_input.toFixed(2)} h⁻¹
                    </span>
                  </div>
                  <input
                    id="sl-sinf"
                    type="range"
                    min="0"
                    max="0.25"
                    step="0.01"
                    value={config.inflammation_input}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        id: 'custom',
                        inflammation_input: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full lab-slider"
                  />
                </div>

                <div>
                  <label htmlFor="sel-inf-prof" className="block text-xs text-slate-600 mb-1">
                    {t.sidebar.inflammationProfile}
                  </label>
                  <select
                    id="sel-inf-prof"
                    value={config.inflammationProfile}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        inflammationProfile: e.target.value as SimulationConfig['inflammationProfile'],
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="constant">{t.sidebar.infConstant}</option>
                    <option value="lps_challenge">{t.sidebar.infLpsChallenge}</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="sl-ktrans" className="text-slate-600">
                      {t.sidebar.kTransLabel} k<sub>trans</sub> (LBP/LPS)
                    </label>
                    <span className="font-mono tabular-nums text-slate-900">
                      {config.params.k_trans.toFixed(3)} h⁻¹
                    </span>
                  </div>
                  <input
                    id="sl-ktrans"
                    type="range"
                    min="0"
                    max="0.05"
                    step="0.002"
                    value={config.params.k_trans}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        params: { ...c.params, k_trans: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-full lab-slider"
                  />
                </div>
              </div>

              {/* Section 3: Patient Calibration */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-800">
                  {t.sidebar.calibrationSection}
                </span>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="sl-mucus" className="text-slate-600">
                      {t.sidebar.mucusAttenuation} (f<sub>mucus</sub>)
                    </label>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {config.params.mucus_attenuation.toFixed(2)}
                    </span>
                  </div>
                  <input
                    id="sl-mucus"
                    type="range"
                    min="0.10"
                    max="1.00"
                    step="0.05"
                    value={config.params.mucus_attenuation}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        params: { ...c.params, mucus_attenuation: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-full lab-slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="sl-alpha" className="text-slate-600">
                      {t.sidebar.ampkGain} (α<sub>AMPK</sub>)
                    </label>
                    <span className="font-mono tabular-nums text-slate-900">
                      {config.params.alpha_AMPK.toFixed(1)}
                    </span>
                  </div>
                  <input
                    id="sl-alpha"
                    type="range"
                    min="0.5"
                    max="3.5"
                    step="0.1"
                    value={config.params.alpha_AMPK}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        params: { ...c.params, alpha_AMPK: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-full lab-slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="sl-ktox" className="text-slate-600">
                      {t.sidebar.toxThreshold} (K<sub>tox</sub>)
                    </label>
                    <span className="font-mono tabular-nums text-slate-900">
                      {config.params.K_tox.toFixed(1)} mM
                    </span>
                  </div>
                  <input
                    id="sl-ktox"
                    type="range"
                    min="4.0"
                    max="14.0"
                    step="0.5"
                    value={config.params.K_tox}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        params: { ...c.params, K_tox: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-full lab-slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="sl-dur" className="text-slate-600">
                      {t.sidebar.timeHorizon}
                    </label>
                    <span className="font-mono tabular-nums text-slate-900">
                      {config.duration_h} h
                    </span>
                  </div>
                  <input
                    id="sl-dur"
                    type="range"
                    min="24"
                    max="96"
                    step="12"
                    value={config.duration_h}
                    onChange={(e) => {
                      const nextDur = parseInt(e.target.value, 10);
                      setConfig((c) => ({ ...c, duration_h: nextDur }));
                      setActiveTimeIndex(Math.round(nextDur / 0.5));
                    }}
                    className="w-full lab-slider"
                  />
                </div>
              </div>
            </aside>

            {/* Right Main Viewport Stage */}
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
              {/* 4-Column Quantitative KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-md p-4">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">
                    {t.kpi.teerTitle} (t = {result.time_h[safeIndex].toFixed(1)}h)
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-mono font-semibold text-slate-900 tabular-nums">
                      {currentTeer.toFixed(1)}
                    </span>
                    <span className="text-xs font-mono text-slate-500 ml-1.5">Ω·cm²</span>
                  </div>
                  <div
                    className={`mt-1 text-xs font-mono tabular-nums ${
                      currentDeltaTeer >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    ΔTEER : {currentDeltaTeer >= 0 ? '+' : ''}
                    {currentDeltaTeer.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-4">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">
                    {t.kpi.pappTitle} P<sub>app</sub> (FD4 4 kDa)
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-mono font-semibold text-slate-900 tabular-nums">
                      {currentPapp.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-500 ml-1.5">×10⁻⁶ cm/s</span>
                  </div>
                  <div
                    className={`mt-1 text-xs font-mono tabular-nums ${
                      currentDeltaP <= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    ΔP% : {currentDeltaP >= 0 ? '+' : ''}
                    {currentDeltaP.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-4">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">
                    {t.kpi.lmTitle}
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-mono font-semibold text-slate-900 tabular-nums">
                      {currentLM.toFixed(3)}
                    </span>
                    <span className="text-xs font-mono text-slate-500 ml-1.5">
                      {t.kpi.lmThreshold}
                    </span>
                  </div>
                  <div
                    className={`mt-1 text-xs font-medium ${
                      barrierStatus.tone === 'nominal'
                        ? 'text-emerald-700'
                        : barrierStatus.tone === 'warning'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {barrierStatus.glyph} {barrierStatus.label}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-4">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">
                    {t.kpi.tjViabilityTitle}
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-mono font-semibold text-slate-900 tabular-nums">
                      {currentTJ.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-500 ml-1.5">
                      / {config.params.TJ_max.toFixed(1)} {t.kpi.maxLabel}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-mono tabular-nums text-slate-600">
                    {t.kpi.viabilityLabel} : {(currentV * 100).toFixed(1)}% · {t.kpi.ampkLabel} : {(currentAmpk * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Timeline Playback & Scrubber Bar */}
              <div className="bg-white border border-slate-200 rounded-md px-4 py-3 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (safeIndex >= result.time_h.length - 1) {
                      setActiveTimeIndex(0);
                    }
                    setIsPlaying((p) => !p);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-sm hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                      {t.playback.pause}
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      {t.playback.play}
                    </>
                  )}
                </button>

                <div className="flex-1 min-w-[200px] flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap">0 h</span>
                  <input
                    type="range"
                    min="0"
                    max={result.time_h.length - 1}
                    step="1"
                    value={safeIndex}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setActiveTimeIndex(parseInt(e.target.value, 10));
                    }}
                    aria-label={t.playback.scrubberAria}
                    className="w-full lab-slider"
                  />
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
                    {config.duration_h} h
                  </span>
                </div>

                <div className="text-xs font-mono tabular-nums text-slate-800 font-semibold whitespace-nowrap">
                  t = {result.time_h[safeIndex].toFixed(1)} h
                </div>
              </div>

              {/* Mechanistic Cross-Section Diagram */}
              <EpithelialDiagram
                lang={lang}
                timeH={result.time_h[safeIndex]}
                butyrateEff={currentButEff}
                inflammationStim={currentInfStim}
                ampk={currentAmpk}
                inflammation={currentInf}
                tj={currentTJ}
                viability={currentV}
                teer={currentTeer}
                papp={currentPapp}
                lmRatio={currentLM}
                mucusAttenuation={config.params.mucus_attenuation}
                tjMax={config.params.TJ_max}
              />

              {/* Dual-Axis Interactive Time-Series Chart */}
              <TimeSeriesChart
                lang={lang}
                result={result}
                activeTimeIndex={safeIndex}
                onSelectTimeIndex={(idx) => {
                  setIsPlaying(false);
                  setActiveTimeIndex(idx);
                }}
                baselineTeer={baselineTeer}
                baselinePapp={config.params.P_pore_0}
              />
            </div>
          </div>
        )}

        {activeTab === 'dose_reponse' && (
          <DoseResponseView
            lang={lang}
            params={config.params}
            inflammationInput={config.inflammation_input}
            durationH={config.duration_h}
            currentButyrate={config.metabolites.butyrate_mM}
            onApplyDose={(dose) => {
              setConfig((c) => ({
                ...c,
                id: 'custom',
                mode: 'single',
                metabolites: { ...c.metabolites, butyrate_mM: dose },
              }));
              setActiveTab('simulateur');
            }}
          />
        )}

        {activeTab === 'scenarios' && (
          <ScenariosView
            lang={lang}
            currentConfig={config}
            onLoadScenario={(sc) => {
              handleLoadScenario(sc);
              setActiveTab('simulateur');
            }}
          />
        )}

        {activeTab === 'modele' && (
          <ModelSpecView lang={lang} params={config.params} result={result} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-3 text-[11px] text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>{t.disclaimer.footer}</span>
          <span className="font-mono text-slate-400 whitespace-nowrap">
            {t.brandTitle} · {t.disclaimer.badge}
          </span>
        </div>
      </footer>
    </div>
  );
}
