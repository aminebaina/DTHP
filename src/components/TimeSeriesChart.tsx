import React, { useState } from 'react';
import { Lang, TRANSLATIONS } from '../i18n';
import { SimulationResult } from '../simulation/gutBarrierOde';

interface TimeSeriesChartProps {
  lang: Lang;
  result: SimulationResult;
  activeTimeIndex: number;
  onSelectTimeIndex: (idx: number) => void;
  baselineTeer: number;
  baselinePapp: number;
}

type ChartChannelMode = 'biophysical' | 'ode_states';

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  lang,
  result,
  activeTimeIndex,
  onSelectTimeIndex,
  baselineTeer,
  baselinePapp,
}) => {
  const [channelMode, setChannelMode] = useState<ChartChannelMode>('biophysical');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const t = TRANSLATIONS[lang].chart;

  const times = result.time_h;
  const maxT = times[times.length - 1] || 48;

  const width = 760;
  const height = 270;
  const pad = { top: 24, right: 64, bottom: 38, left: 60 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const inspectIdx = hoverIdx !== null ? hoverIdx : activeTimeIndex;

  const teerArr = result.permeability_timeseries.TEER_ohm_cm2;
  const pappArr = result.permeability_timeseries.Papp_FD4_1e6_cm_s;
  const ampkArr = result.states.AMPK_activation;
  const infArr = result.states.inflammation;
  const tjArr = result.states.tight_junction_integrity;
  const viabArr = result.states.cell_viability;

  const maxTeer = Math.max(800, ...teerArr.map((v) => Math.ceil(v / 100) * 100));
  const minTeer = 0;
  const maxPapp = Math.max(2.0, ...pappArr.map((v) => Math.ceil(v * 2) / 2));
  const minPapp = 0;
  const maxOdeRight = Math.max(1.6, ...tjArr, ...infArr.map((v) => Math.ceil(v * 2) / 2));

  const xScale = (time: number) => pad.left + (time / maxT) * plotW;

  const yLeftBio = (val: number) =>
    pad.top + plotH - ((val - minTeer) / (maxTeer - minTeer)) * plotH;
  const yRightBio = (val: number) =>
    pad.top + plotH - ((val - minPapp) / (maxPapp - minPapp)) * plotH;

  const yLeftOde = (val: number) => pad.top + plotH - val * plotH;
  const yRightOde = (val: number) => pad.top + plotH - (val / maxOdeRight) * plotH;

  const buildPath = (values: number[], yMap: (v: number) => number) =>
    values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(times[i]).toFixed(1)} ${yMap(v).toFixed(1)}`)
      .join(' ');

  const handlePointerMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const clamped = Math.max(pad.left, Math.min(width - pad.right, relX));
    const ratio = (clamped - pad.left) / plotW;
    const nearest = Math.round(ratio * (times.length - 1));
    setHoverIdx(Math.max(0, Math.min(times.length - 1, nearest)));
  };

  const handleClick = () => {
    if (hoverIdx !== null) {
      onSelectTimeIndex(hoverIdx);
    }
  };

  const xTicks = [0, maxT * 0.25, maxT * 0.5, maxT * 0.75, maxT];
  const leakyThresholdPapp = baselinePapp * (0.05 / 0.025);

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t.titlePrefix} (0 → {maxT} h)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded border border-slate-200">
          <button
            type="button"
            onClick={() => setChannelMode('biophysical')}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              channelMode === 'biophysical'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabBio} (TEER / P<sub>app</sub>)
          </button>
          <button
            type="button"
            onClick={() => setChannelMode('ode_states')}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              channelMode === 'ode_states'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabOde}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono tabular-nums">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">{t.time}</span>
          <span className="text-slate-900 font-semibold">{times[inspectIdx].toFixed(1)} h</span>
        </div>
        {channelMode === 'biophysical' ? (
          <>
            <div>
              <span className="text-cyan-700 block text-[10px] uppercase">{t.teer}</span>
              <span className="text-slate-900 font-semibold">{teerArr[inspectIdx].toFixed(1)} Ω·cm²</span>
            </div>
            <div>
              <span className="text-rose-700 block text-[10px] uppercase">{t.papp}</span>
              <span className="text-slate-900 font-semibold">{pappArr[inspectIdx].toFixed(3)} ×10⁻⁶</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">{t.lmRatio}</span>
              <span className="text-slate-900 font-semibold">
                {result.permeability_timeseries.lactulose_mannitol_ratio[inspectIdx].toFixed(3)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">{t.deltaPerm}</span>
              <span className="text-slate-900 font-semibold">
                {result.permeability_timeseries.delta_permeability_pct[inspectIdx] >= 0 ? '+' : ''}
                {result.permeability_timeseries.delta_permeability_pct[inspectIdx].toFixed(1)}%
              </span>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="text-cyan-700 block text-[10px] uppercase">{t.ampkState}</span>
              <span className="text-slate-900 font-semibold">{(ampkArr[inspectIdx] * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-amber-700 block text-[10px] uppercase">{t.infState}</span>
              <span className="text-slate-900 font-semibold">{infArr[inspectIdx].toFixed(3)}</span>
            </div>
            <div>
              <span className="text-blue-700 block text-[10px] uppercase">{t.tjState}</span>
              <span className="text-slate-900 font-semibold">{tjArr[inspectIdx].toFixed(3)}</span>
            </div>
            <div>
              <span className="text-emerald-700 block text-[10px] uppercase">{t.viabState}</span>
              <span className="text-slate-900 font-semibold">{(viabArr[inspectIdx] * 100).toFixed(1)}%</span>
            </div>
          </>
        )}
      </div>

      <div className="w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block cursor-crosshair select-none"
          onMouseMove={handlePointerMove}
          onMouseLeave={() => setHoverIdx(null)}
          onClick={handleClick}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
            const y = pad.top + plotH * (1 - frac);
            const leftLabel =
              channelMode === 'biophysical'
                ? Math.round(minTeer + frac * (maxTeer - minTeer))
                : (frac * 100).toFixed(0) + '%';
            const rightLabel =
              channelMode === 'biophysical'
                ? (minPapp + frac * (maxPapp - minPapp)).toFixed(1)
                : (frac * maxOdeRight).toFixed(2);

            return (
              <g key={`grid-${idx}`}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#e2e8f0" strokeWidth="0.8" />
                <text x={pad.left - 8} y={y + 3} textAnchor="end" className="fill-slate-500 text-[9.5px] font-mono tabular-nums">
                  {leftLabel}
                </text>
                <text x={width - pad.right + 8} y={y + 3} textAnchor="start" className="fill-slate-500 text-[9.5px] font-mono tabular-nums">
                  {rightLabel}
                </text>
              </g>
            );
          })}

          {xTicks.map((tick, idx) => {
            const x = xScale(tick);
            return (
              <g key={`xtick-${idx}`}>
                <line x1={x} y1={pad.top} x2={x} y2={pad.top + plotH} stroke="#f1f5f9" strokeWidth="0.8" />
                <text x={x} y={pad.top + plotH + 16} textAnchor="middle" className="fill-slate-500 text-[9.5px] font-mono tabular-nums">
                  {tick.toFixed(0)} h
                </text>
              </g>
            );
          })}

          <text x={pad.left} y={13} className="fill-cyan-700 text-[9.5px] font-mono font-semibold">
            {channelMode === 'biophysical' ? t.axisTeer : t.axisOdePct}
          </text>
          <text x={width - pad.right} y={13} textAnchor="end" className="fill-rose-700 text-[9.5px] font-mono font-semibold">
            {channelMode === 'biophysical' ? t.axisPapp : t.axisOdeUnits}
          </text>

          {channelMode === 'biophysical' && (
            <g>
              <line
                x1={pad.left}
                y1={yLeftBio(baselineTeer)}
                x2={width - pad.right}
                y2={yLeftBio(baselineTeer)}
                stroke="#0891b2"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              {leakyThresholdPapp <= maxPapp && (
                <g>
                  <line
                    x1={pad.left}
                    y1={yRightBio(leakyThresholdPapp)}
                    x2={width - pad.right}
                    y2={yRightBio(leakyThresholdPapp)}
                    stroke="#dc2626"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.7"
                  />
                  <text x={pad.left + 6} y={yRightBio(leakyThresholdPapp) - 4} className="fill-red-600 text-[8.5px] font-mono">
                    {t.leakyThreshold}
                  </text>
                </g>
              )}
            </g>
          )}

          {channelMode === 'biophysical' ? (
            <g>
              <path d={buildPath(teerArr, yLeftBio)} fill="none" stroke="#0891b2" strokeWidth="2.2" />
              <path d={buildPath(pappArr, yRightBio)} fill="none" stroke="#e11d48" strokeWidth="2.2" />
            </g>
          ) : (
            <g>
              <path d={buildPath(ampkArr, yLeftOde)} fill="none" stroke="#0891b2" strokeWidth="2" />
              <path d={buildPath(viabArr, yLeftOde)} fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="5 3" />
              <path d={buildPath(tjArr, yRightOde)} fill="none" stroke="#2563eb" strokeWidth="2.2" />
              <path d={buildPath(infArr, yRightOde)} fill="none" stroke="#d97706" strokeWidth="2" />
            </g>
          )}

          <line
            x1={xScale(times[activeTimeIndex])}
            y1={pad.top}
            x2={xScale(times[activeTimeIndex])}
            y2={pad.top + plotH}
            stroke="#0f172a"
            strokeWidth="1.2"
          />

          {hoverIdx !== null && (
            <line
              x1={xScale(times[hoverIdx])}
              y1={pad.top}
              x2={xScale(times[hoverIdx])}
              y2={pad.top + plotH}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {channelMode === 'biophysical' ? (
            <>
              <circle cx={xScale(times[inspectIdx])} cy={yLeftBio(teerArr[inspectIdx])} r="4" fill="#0891b2" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx={xScale(times[inspectIdx])} cy={yRightBio(pappArr[inspectIdx])} r="4" fill="#e11d48" stroke="#ffffff" strokeWidth="1.5" />
            </>
          ) : (
            <>
              <circle cx={xScale(times[inspectIdx])} cy={yLeftOde(ampkArr[inspectIdx])} r="3.5" fill="#0891b2" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx={xScale(times[inspectIdx])} cy={yLeftOde(viabArr[inspectIdx])} r="3.5" fill="#059669" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx={xScale(times[inspectIdx])} cy={yRightOde(tjArr[inspectIdx])} r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx={xScale(times[inspectIdx])} cy={yRightOde(infArr[inspectIdx])} r="3.5" fill="#d97706" stroke="#ffffff" strokeWidth="1.2" />
            </>
          )}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 pt-1 border-t border-slate-100">
        {channelMode === 'biophysical' ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-cyan-600 inline-block" aria-hidden="true" />
              {t.legendTeer}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-rose-600 inline-block" aria-hidden="true" />
              P<sub>app</sub> {t.legendPapp}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t border-dashed border-cyan-600 inline-block" aria-hidden="true" />
              {t.legendBaselineTeer} ({baselineTeer.toFixed(1)} Ω·cm²)
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-cyan-600 inline-block" aria-hidden="true" />
              {t.legendAmpk}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-blue-600 inline-block" aria-hidden="true" />
              {t.legendTj}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-amber-600 inline-block" aria-hidden="true" />
              {t.legendInf}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-emerald-600 inline-block" aria-hidden="true" />
              {t.legendViab}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
