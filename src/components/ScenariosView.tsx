import React, { useMemo } from 'react';
import { Lang, TRANSLATIONS } from '../i18n';
import {
  REFERENCE_SCENARIOS,
  SimulationConfig,
  classifyBarrierState,
  runConfigSimulation,
} from '../simulation/gutBarrierOde';

interface ScenariosViewProps {
  lang: Lang;
  currentConfig: SimulationConfig;
  onLoadScenario: (scenario: SimulationConfig) => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  lang,
  currentConfig,
  onLoadScenario,
}) => {
  const t = TRANSLATIONS[lang].scenariosView;
  const scenarioDict = TRANSLATIONS[lang].scenarios;

  const rows = useMemo(() => {
    const refRows = REFERENCE_SCENARIOS.map((sc) => ({
      config: sc,
      label: scenarioDict[sc.id]?.label ?? sc.label,
      description: scenarioDict[sc.id]?.description ?? sc.description,
      isCurrent: false,
      result: runConfigSimulation(sc),
    }));
    const customRow = {
      config: currentConfig,
      label: t.activeSimLabel,
      description: t.activeSimDesc,
      isCurrent: true,
      result: runConfigSimulation(currentConfig),
    };
    return [...refRows, customRow];
  }, [currentConfig, scenarioDict, t.activeSimDesc, t.activeSimLabel]);

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col gap-4">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-semibold text-slate-900">{t.title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{t.subtitle}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50">
              <th className="py-2.5 px-3 font-semibold">{t.colScenario}</th>
              <th className="py-2.5 px-3 font-semibold text-right">{t.colTj}</th>
              <th className="py-2.5 px-3 font-semibold text-right">{t.colViability}</th>
              <th className="py-2.5 px-3 font-semibold text-right">{t.colTeer}</th>
              <th className="py-2.5 px-3 font-semibold text-right">{t.colDeltaTeer}</th>
              <th className="py-2.5 px-3 font-semibold text-right">
                P<sub>app</sub> {t.colPapp}
              </th>
              <th className="py-2.5 px-3 font-semibold text-right">{t.colDeltaP}</th>
              <th className="py-2.5 px-3 font-semibold text-right">{t.colLm}</th>
              <th className="py-2.5 px-3 font-semibold">{t.colStatus}</th>
              <th className="py-2.5 px-3 font-semibold text-right">{t.colAction}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ config, label, description, isCurrent, result }) => {
              const s = result.final_snapshot;
              const status = classifyBarrierState(s.lactulose_mannitol_ratio, s.cell_viability, lang);
              const toneClass =
                status.tone === 'nominal'
                  ? 'text-emerald-700'
                  : status.tone === 'warning'
                  ? 'text-amber-700'
                  : 'text-rose-700';

              return (
                <tr
                  key={isCurrent ? 'current-active' : config.id}
                  className={isCurrent ? 'bg-cyan-50/50 font-medium' : 'hover:bg-slate-50/70'}
                >
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-900">{label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                      {description}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                    {s.TJ_integrity.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                    {(s.cell_viability * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {s.TEER_ohm_cm2.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                    {s.delta_TEER_pct >= 0 ? '+' : ''}
                    {s.delta_TEER_pct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {s.Papp_FD4_1e6_cm_s.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                    {s.delta_permeability_pct >= 0 ? '+' : ''}
                    {s.delta_permeability_pct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {s.lactulose_mannitol_ratio.toFixed(3)}
                  </td>
                  <td className={`py-3 px-3 whitespace-nowrap font-medium ${toneClass}`}>
                    {status.glyph} {status.label}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {isCurrent ? (
                      <span className="text-[11px] text-cyan-700 font-mono">{t.activeBadge}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onLoadScenario(config)}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-sm hover:bg-slate-900 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {t.loadBtn}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
