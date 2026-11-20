import React from 'react';
import { Lang, TRANSLATIONS } from '../i18n';
import { classifyBarrierState } from '../simulation/gutBarrierOde';

interface EpithelialDiagramProps {
  lang: Lang;
  timeH: number;
  butyrateEff: number;
  inflammationStim: number;
  ampk: number;
  inflammation: number;
  tj: number;
  viability: number;
  teer: number;
  papp: number;
  lmRatio: number;
  mucusAttenuation: number;
  tjMax: number;
}

export const EpithelialDiagram: React.FC<EpithelialDiagramProps> = ({
  lang,
  timeH,
  butyrateEff,
  inflammationStim,
  ampk,
  inflammation,
  tj,
  viability,
  teer,
  papp,
  lmRatio,
  mucusAttenuation,
  tjMax,
}) => {
  const t = TRANSLATIONS[lang].diagram;
  const statusInfo = classifyBarrierState(lmRatio, viability);
  const statusText = TRANSLATIONS[lang].status[statusInfo.i18nKey];
  const status = { ...statusInfo, ...statusText };
  const normalizedTJ = Math.min(1, Math.max(0, tj / tjMax));
  const gapPx = Math.max(4, (1 - normalizedTJ) * 28 + (1 - viability) * 44);
  const cellHeightShrink = (1 - viability) * 42;
  const mucusHeight = mucusAttenuation >= 0.9 ? 10 : Math.round((1 - mucusAttenuation) * 44 + 14);
  const strandOpacity = Math.max(0.15, Math.min(1, tj / 1.1));
  const strandCount = Math.max(1, Math.round(tj * 4));
  const fluxIntensity = Math.min(1, Math.max(0.08, papp / 2.2));
  const leftCellRightEdge = 240 - gapPx / 2;
  const rightCellLeftEdge = 240 + gapPx / 2;

  const toneBadgeColor =
    status.tone === 'nominal'
      ? 'text-emerald-700'
      : status.tone === 'warning'
      ? 'text-amber-700'
      : 'text-rose-700';

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.instant} <span className="font-mono tabular-nums text-slate-800">{timeH.toFixed(1)} h</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            B<sub>epi</sub> = <span className="font-mono tabular-nums text-slate-800">{butyrateEff.toFixed(2)} mM</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            f<sub>mucus</sub> = <span className="font-mono tabular-nums text-slate-800">{mucusAttenuation.toFixed(2)}</span>
          </p>
        </div>
        <div className={`text-xs font-medium whitespace-nowrap ${toneBadgeColor}`}>
          <span className="mr-1" aria-hidden="true">{status.glyph}</span>
          {status.label}
        </div>
      </div>

      <div className="w-full overflow-hidden rounded border border-slate-200 bg-slate-50">
        <svg
          viewBox="0 0 480 265"
          className="w-full h-auto block select-none"
          role="img"
          aria-label={t.ariaLabel}
        >
          <defs>
            <pattern id="microgrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.6" />
            </pattern>
            <linearGradient id="mucusGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cffafe" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.6" />
            </linearGradient>
            <marker id="fluxArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#dc2626" />
            </marker>
            <marker id="ampkArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#0891b2" />
            </marker>
          </defs>

          <rect width="480" height="265" fill="url(#microgrid)" />

          <rect x="0" y="0" width="480" height="62" fill="#f1f5f9" fillOpacity="0.85" />
          <text x="14" y="18" className="fill-slate-500 text-[9px] font-mono uppercase tracking-wider">
            {t.lumenHeader}
          </text>

          {mucusAttenuation < 0.98 ? (
            <g>
              <rect
                x="0"
                y={74 - mucusHeight}
                width="480"
                height={mucusHeight}
                fill="url(#mucusGrad)"
                stroke="#06b6d4"
                strokeWidth="0.75"
                strokeDasharray="3 2"
              />
              <text x="14" y={74 - mucusHeight + 11} className="fill-cyan-800 text-[8.5px] font-mono">
                {t.mucusLayer} {mucusAttenuation.toFixed(2)})
              </text>
            </g>
          ) : (
            <text x="14" y="66" className="fill-slate-400 text-[8.5px] font-mono">
              {t.noMucus}
            </text>
          )}

          {Array.from({ length: Math.min(14, Math.round(butyrateEff * 2.5)) }).map((_, idx) => {
            const cx = 36 + ((idx * 33) % 410);
            const cy = 28 + ((idx * 17) % 24);
            return (
              <rect
                key={`but-${idx}`}
                x={cx}
                y={cy}
                width="6"
                height="6"
                rx="1"
                fill="#0891b2"
                fillOpacity="0.85"
              />
            );
          })}
          {Array.from({ length: Math.min(10, Math.round((inflammationStim + inflammation) * 28)) }).map((_, idx) => {
            const cx = 52 + ((idx * 47) % 385);
            const cy = 26 + ((idx * 23) % 26);
            return (
              <polygon
                key={`inf-${idx}`}
                points={`${cx},${cy} ${cx + 4},${cy + 7} ${cx - 4},${cy + 7}`}
                fill="#d97706"
                fillOpacity="0.9"
              />
            );
          })}

          <g>
            {Array.from({ length: Math.floor((leftCellRightEdge - 24) / 10) }).map((_, i) => (
              <rect
                key={`mv-l-${i}`}
                x={24 + i * 10}
                y={74 + cellHeightShrink}
                width="5"
                height="8"
                rx="2"
                fill={viability < 0.8 ? '#fecdd3' : '#e2e8f0'}
                stroke={viability < 0.8 ? '#e11d48' : '#64748b'}
                strokeWidth="0.9"
              />
            ))}
            <rect
              x="20"
              y={82 + cellHeightShrink}
              width={leftCellRightEdge - 20}
              height={138 - cellHeightShrink}
              rx="3"
              fill={viability < 0.8 ? '#fff1f2' : '#ffffff'}
              stroke={viability < 0.8 ? '#e11d48' : '#475569'}
              strokeWidth="1.4"
            />
            <ellipse
              cx={Math.max(70, leftCellRightEdge * 0.45)}
              cy={165 + cellHeightShrink * 0.4}
              rx="26"
              ry="16"
              fill="#f1f5f9"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <text x="32" y="102" className="fill-slate-700 text-[9.5px] font-semibold">
              {t.colonocyteA}
            </text>
            <rect
              x="32"
              y="112"
              width="126"
              height="24"
              rx="2"
              fill="#ecfeff"
              stroke="#0891b2"
              strokeWidth="0.9"
              fillOpacity={0.3 + ampk * 0.7}
            />
            <text x="38" y="127" className="fill-cyan-900 text-[9px] font-mono">
              AMPK/HDACi: {(ampk * 100).toFixed(0)}%
            </text>
            {ampk > 0.05 && (
              <line
                x1="158"
                y1="124"
                x2={leftCellRightEdge - 8}
                y2="112"
                stroke="#0891b2"
                strokeWidth="1.4"
                strokeDasharray="3 2"
                markerEnd="url(#ampkArrow)"
              />
            )}
          </g>

          <g>
            {Array.from({ length: Math.floor((456 - rightCellLeftEdge) / 10) }).map((_, i) => (
              <rect
                key={`mv-r-${i}`}
                x={rightCellLeftEdge + 4 + i * 10}
                y={74 + cellHeightShrink}
                width="5"
                height="8"
                rx="2"
                fill={viability < 0.8 ? '#fecdd3' : '#e2e8f0'}
                stroke={viability < 0.8 ? '#e11d48' : '#64748b'}
                strokeWidth="0.9"
              />
            ))}
            <rect
              x={rightCellLeftEdge}
              y={82 + cellHeightShrink}
              width={460 - rightCellLeftEdge}
              height={138 - cellHeightShrink}
              rx="3"
              fill={viability < 0.8 ? '#fff1f2' : '#ffffff'}
              stroke={viability < 0.8 ? '#e11d48' : '#475569'}
              strokeWidth="1.4"
            />
            <ellipse
              cx={Math.min(410, rightCellLeftEdge + (460 - rightCellLeftEdge) * 0.58)}
              cy={165 + cellHeightShrink * 0.4}
              rx="26"
              ry="16"
              fill="#f1f5f9"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <text x={rightCellLeftEdge + 16} y="102" className="fill-slate-700 text-[9.5px] font-semibold">
              {t.colonocyteB}
            </text>
            <rect
              x={rightCellLeftEdge + 16}
              y="112"
              width="126"
              height="24"
              rx="2"
              fill={inflammation > 0.15 ? '#fef3c7' : '#f8fafc'}
              stroke={inflammation > 0.15 ? '#d97706' : '#cbd5e1'}
              strokeWidth="0.9"
            />
            <text
              x={rightCellLeftEdge + 22}
              y="127"
              className={`text-[9px] font-mono ${inflammation > 0.15 ? 'fill-amber-900' : 'fill-slate-600'}`}
            >
              NF-κB / I(t): {inflammation.toFixed(2)}
            </text>
          </g>

          <g>
            {Array.from({ length: strandCount }).map((_, idx) => {
              const yPos = 92 + cellHeightShrink + idx * 7.5;
              return (
                <g key={`tj-strand-${idx}`} opacity={strandOpacity}>
                  <line
                    x1={leftCellRightEdge - 5}
                    y1={yPos}
                    x2={rightCellLeftEdge + 5}
                    y2={yPos}
                    stroke="#0284c7"
                    strokeWidth="2.4"
                  />
                  <circle cx={leftCellRightEdge - 4} cy={yPos} r="2.2" fill="#0f172a" />
                  <circle cx={rightCellLeftEdge + 4} cy={yPos} r="2.2" fill="#0f172a" />
                </g>
              );
            })}
            <text
              x="240"
              y={76 + cellHeightShrink}
              textAnchor="middle"
              className="fill-cyan-900 text-[8.5px] font-mono font-semibold"
            >
              TJ = {tj.toFixed(2)}
            </text>
          </g>

          <g opacity={fluxIntensity}>
            <line
              x1="240"
              y1="82"
              x2="240"
              y2="218"
              stroke="#dc2626"
              strokeWidth={1.2 + fluxIntensity * 2.5}
              strokeDasharray="4 3"
              markerEnd="url(#fluxArrow)"
            />
          </g>

          <rect x="0" y="220" width="480" height="45" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
          <text x="14" y="236" className="fill-slate-500 text-[9px] font-mono uppercase tracking-wider">
            {t.laminaPropria}
          </text>
          <text x="14" y="253" className="fill-slate-800 text-[10px] font-mono tabular-nums">
            TEER = {teer.toFixed(1)} Ω·cm²   |   Papp(FD4) = {papp.toFixed(2)}×10⁻⁶ cm/s   |   {t.viabilityShort} {(viability * 100).toFixed(1)}%
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-cyan-600 inline-block rounded-[1px]" aria-hidden="true" />
            {t.legendMetabolites}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-600 inline-block rounded-[1px]" aria-hidden="true" />
            {t.legendInflammation}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-600 inline-block" aria-hidden="true" />
            {t.legendTj}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-red-600 inline-block border-t border-dashed border-red-600" aria-hidden="true" />
            {t.legendFlux} (P<sub>app</sub>)
          </span>
        </div>
        <span className="text-slate-500">{status.detail}</span>
      </div>
    </div>
  );
};
