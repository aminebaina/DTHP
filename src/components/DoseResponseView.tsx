import React, { useMemo, useState } from 'react';
import { Lang, TRANSLATIONS } from '../i18n';
import {
  DEFAULT_PATIENT_PARAMS,
  PatientBarrierParams,
  classifyBarrierState,
  computeDoseResponseSweep,
} from '../simulation/gutBarrierOde';

interface DoseResponseViewProps {
  lang: Lang;
  params: PatientBarrierParams;
  inflammationInput: number;
  durationH: number;
  currentButyrate: number;
  onApplyDose: (dose: number) => void;
}

export const DoseResponseView: React.FC<DoseResponseViewProps> = ({
  lang,
  params,
  inflammationInput,
  durationH,
  currentButyrate,
  onApplyDose,
}) => {
  const [maxDose, setMaxDose] = useState<number>(12);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const t = TRANSLATIONS[lang].doseResponse;

  const patientSweep = useMemo(
    () => computeDoseResponseSweep(params, inflammationInput, durationH, maxDose, 48),
    [params, inflammationInput, durationH, maxDose]
  );

  const inVitroSweep = useMemo(
    () =>
      computeDoseResponseSweep(
        { ...DEFAULT_PATIENT_PARAMS, mucus_attenuation: 1.0 },
        inflammationInput,
        durationH,
        maxDose,
        48
      ),
    [inflammationInput, durationH, maxDose]
  );

  const width = 820;
  const height = 310;
  const pad = { top: 26, right: 64, bottom: 42, left: 62 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxTeer = Math.max(
    800,
    ...patientSweep.map((p) => Math.ceil(p.TEER_ohm_cm2 / 100) * 100),
    ...inVitroSweep.map((p) => Math.ceil(p.TEER_ohm_cm2 / 100) * 100)
  );
  const maxPapp = Math.max(
    3.0,
    ...patientSweep.map((p) => Math.ceil(p.Papp_FD4_1e6_cm_s)),
    ...inVitroSweep.map((p) => Math.ceil(p.Papp_FD4_1e6_cm_s))
  );

  const xScale = (dose: number) => pad.left + (dose / maxDose) * plotW;
  const yTeer = (val: number) => pad.top + plotH - (val / maxTeer) * plotH;
  const yPapp = (val: number) => pad.top + plotH - (val / maxPapp) * plotH;

  const inspectIdx = hoverIdx !== null ? hoverIdx : Math.min(48, Math.round((currentButyrate / maxDose) * 48));
  const inspectedPoint = patientSweep[inspectIdx] || patientSweep[0];
  const inspectedStatusInfo = classifyBarrierState(
    inspectedPoint.lactulose_mannitol_ratio,
    inspectedPoint.cell_viability
  );
  const inspectedStatus = {
    ...inspectedStatusInfo,
    ...TRANSLATIONS[lang].status[inspectedStatusInfo.i18nKey],
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const clamped = Math.max(pad.left, Math.min(width - pad.right, relX));
    const idx = Math.round(((clamped - pad.left) / plotW) * (patientSweep.length - 1));
    setHoverIdx(Math.max(0, Math.min(patientSweep.length - 1, idx)));
  };

  const optimalPoint = patientSweep.reduce((best, cur) =>
    cur.Papp_FD4_1e6_cm_s < best.Papp_FD4_1e6_cm_s ? cur : best
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{t.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.subtitleStart}f<sub>mucus</sub> = {params.mucus_attenuation.toFixed(2)}
              {t.subtitleMid}f<sub>mucus</sub> = 1.00{t.subtitleEnd} {durationH} h
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t.luminalRange}</span>
            {[12, 24, 36].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setMaxDose(range)}
                className={`px-2.5 py-1 text-xs font-mono rounded-sm border transition-colors cursor-pointer whitespace-nowrap ${
                  maxDose === range
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                0–{range} mM
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded p-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 block">
              {t.inspectedDose}
            </span>
            <span className="text-lg font-mono font-semibold text-slate-900 tabular-nums">
              {inspectedPoint.dose_mM.toFixed(2)} mM
            </span>
            <span className="block text-[11px] font-mono text-slate-500">
              B<sub>epi</sub> = {inspectedPoint.effective_epi_mM.toFixed(2)} mM
            </span>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 block">
              {t.teerAndPapp} P<sub>app</sub>
            </span>
            <span className="text-lg font-mono font-semibold text-cyan-700 tabular-nums">
              {inspectedPoint.TEER_ohm_cm2.toFixed(1)} Ω·cm²
            </span>
            <span className="block text-[11px] font-mono text-rose-700 tabular-nums">
              P<sub>app</sub> = {inspectedPoint.Papp_FD4_1e6_cm_s.toFixed(2)}×10⁻⁶ cm/s
            </span>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 block">
              {t.optimalWindow}
            </span>
            <span className="text-lg font-mono font-semibold text-emerald-700 tabular-nums">
              {optimalPoint.dose_mM.toFixed(2)} mM
            </span>
            <span className="block text-[11px] font-mono text-slate-500 tabular-nums">
              {t.minPapp} P<sub>app</sub> = {optimalPoint.Papp_FD4_1e6_cm_s.toFixed(2)} ({optimalPoint.delta_permeability_pct.toFixed(1)}%)
            </span>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 block">
              {t.statusAtDose}
            </span>
            <span
              className={`text-sm font-semibold block mt-1 ${
                inspectedStatus.tone === 'nominal'
                  ? 'text-emerald-700'
                  : inspectedStatus.tone === 'warning'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {inspectedStatus.glyph} {inspectedStatus.label}
            </span>
            <span className="block text-[11px] font-mono text-slate-500 tabular-nums">
              {t.viability} {(inspectedPoint.cell_viability * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
          onClick={() => onApplyDose(inspectedPoint.dose_mM)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
            const y = pad.top + plotH * (1 - frac);
            return (
              <g key={`dr-grid-${i}`}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#e2e8f0" strokeWidth="0.8" />
                <text x={pad.left - 8} y={y + 3} textAnchor="end" className="fill-slate-500 text-[9.5px] font-mono tabular-nums">
                  {Math.round(frac * maxTeer)}
                </text>
                <text x={width - pad.right + 8} y={y + 3} textAnchor="start" className="fill-slate-500 text-[9.5px] font-mono tabular-nums">
                  {(frac * maxPapp).toFixed(1)}
                </text>
              </g>
            );
          })}

          {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
            const d = frac * maxDose;
            return (
              <text
                key={`dr-x-${i}`}
                x={xScale(d)}
                y={pad.top + plotH + 18}
                textAnchor="middle"
                className="fill-slate-500 text-[9.5px] font-mono tabular-nums"
              >
                {d.toFixed(1)} mM
              </text>
            );
          })}

          <text x={pad.left} y={14} className="fill-cyan-700 text-[9.5px] font-mono font-semibold">
            {t.axisTeerPrefix} t={durationH}h (Ω·cm²)
          </text>
          <text x={width - pad.right} y={14} textAnchor="end" className="fill-rose-700 text-[9.5px] font-mono font-semibold">
            {t.axisPappPrefix} t={durationH}h (10⁻⁶ cm/s)
          </text>

          <path
            d={inVitroSweep
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.dose_mM).toFixed(1)} ${yTeer(p.TEER_ohm_cm2).toFixed(1)}`)
              .join(' ')}
            fill="none"
            stroke="#0891b2"
            strokeWidth="1.4"
            strokeDasharray="4 4"
            opacity="0.45"
          />
          <path
            d={inVitroSweep
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.dose_mM).toFixed(1)} ${yPapp(p.Papp_FD4_1e6_cm_s).toFixed(1)}`)
              .join(' ')}
            fill="none"
            stroke="#e11d48"
            strokeWidth="1.4"
            strokeDasharray="4 4"
            opacity="0.45"
          />

          <path
            d={patientSweep
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.dose_mM).toFixed(1)} ${yTeer(p.TEER_ohm_cm2).toFixed(1)}`)
              .join(' ')}
            fill="none"
            stroke="#0891b2"
            strokeWidth="2.4"
          />
          <path
            d={patientSweep
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.dose_mM).toFixed(1)} ${yPapp(p.Papp_FD4_1e6_cm_s).toFixed(1)}`)
              .join(' ')}
            fill="none"
            stroke="#e11d48"
            strokeWidth="2.4"
          />

          {currentButyrate <= maxDose && (
            <line
              x1={xScale(currentButyrate)}
              y1={pad.top}
              x2={xScale(currentButyrate)}
              y2={pad.top + plotH}
              stroke="#0f172a"
              strokeWidth="1.2"
            />
          )}

          <line
            x1={xScale(inspectedPoint.dose_mM)}
            y1={pad.top}
            x2={xScale(inspectedPoint.dose_mM)}
            y2={pad.top + plotH}
            stroke="#64748b"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <circle
            cx={xScale(inspectedPoint.dose_mM)}
            cy={yTeer(inspectedPoint.TEER_ohm_cm2)}
            r="4.5"
            fill="#0891b2"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <circle
            cx={xScale(inspectedPoint.dose_mM)}
            cy={yPapp(inspectedPoint.Papp_FD4_1e6_cm_s)}
            r="4.5"
            fill="#e11d48"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        </svg>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-cyan-600 inline-block" aria-hidden="true" />
              {t.legendActiveTeer}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-rose-600 inline-block" aria-hidden="true" />
              P<sub>app</sub> {t.legendActivePapp}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t border-dashed border-slate-500 inline-block" aria-hidden="true" />
              {t.legendRefInVitro} (f<sub>mucus</sub> = 1.0)
            </span>
          </div>
          <span className="text-slate-500">{t.clickHint}</span>
        </div>
      </div>
    </div>
  );
};
