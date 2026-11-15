import React, { useState } from 'react';
import { Lang, TRANSLATIONS } from '../i18n';
import { PatientBarrierParams, SimulationResult } from '../simulation/gutBarrierOde';

interface ModelSpecViewProps {
  lang: Lang;
  params: PatientBarrierParams;
  result: SimulationResult;
}

export const ModelSpecView: React.FC<ModelSpecViewProps> = ({ lang, params, result }) => {
  const [copied, setCopied] = useState(false);
  const t = TRANSLATIONS[lang].modelSpec;

  const jsonPayload = JSON.stringify(
    {
      patient_barrier_params: params,
      final_snapshot: result.final_snapshot,
      sample_count: result.time_h.length,
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard?.writeText(jsonPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-5 flex flex-col gap-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">{t.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex flex-col gap-4 text-xs">
          <div className="border border-slate-200 rounded p-3.5 bg-slate-50">
            <div className="font-semibold text-slate-800 mb-1">{t.eq1Title}</div>
            <div className="font-mono text-slate-900 bg-white border border-slate-200 rounded px-3 py-2 overflow-x-auto">
              dA/dt = k_on,A · [B_epi^n_A / (K_A^n_A + B_epi^n_A)] · (1 − A) − k_off,A · A
            </div>
            <p className="text-slate-600 mt-1.5">
              B<sub>epi</sub>(t) = f<sub>mucus</sub> · B<sub>lumen</sub>(t) {t.eq1Note}
            </p>
          </div>

          <div className="border border-slate-200 rounded p-3.5 bg-slate-50">
            <div className="font-semibold text-slate-800 mb-1">{t.eq2Title}</div>
            <div className="font-mono text-slate-900 bg-white border border-slate-200 rounded px-3 py-2 overflow-x-auto">
              dI/dt = S_inf(t) + k_trans · max(0, P_app(t)/P_app,0 − 1) − (k_clear,I + k_anti,I · H_I(B_epi)) · I
            </div>
            <p className="text-slate-600 mt-1.5">
              k<sub>trans</sub> {t.eq2Note}
            </p>
          </div>

          <div className="border border-slate-200 rounded p-3.5 bg-slate-50">
            <div className="font-semibold text-slate-800 mb-1">{t.eq3Title}</div>
            <div className="font-mono text-slate-900 bg-white border border-slate-200 rounded px-3 py-2 overflow-x-auto">
              dTJ/dt = k_ass · (1 + α_AMPK · A) · (TJ_max − TJ) − (k_dis,0 + k_inf · I) · TJ
            </div>
          </div>

          <div className="border border-slate-200 rounded p-3.5 bg-slate-50">
            <div className="font-semibold text-slate-800 mb-1">{t.eq4Title}</div>
            <div className="font-mono text-slate-900 bg-white border border-slate-200 rounded px-3 py-2 overflow-x-auto">
              dV/dt = k_prolif · V · (1 − V) − k_apop · [B_epi^n_T / (K_tox^n_T + B_epi^n_T)] · V
            </div>
          </div>

          <div className="border border-slate-200 rounded p-3.5 bg-slate-50">
            <div className="font-semibold text-slate-800 mb-1">{t.eq5Title}</div>
            <div className="font-mono text-slate-900 bg-white border border-slate-200 rounded px-3 py-2 space-y-1 overflow-x-auto">
              <div>G_total(t) = G_cell + G_TJ,0 · exp(−β · (TJ(t) − TJ_0)) + G_leak · (1 − V(t))</div>
              <div>TEER(t) = 1000 / G_total(t)   [Ω·cm²]</div>
              <div>P_app(t) = P_pore,0 · (TJ_0 / max(TJ(t), 0.05))^γ + P_leak · (1 − V(t))   [10⁻⁶ cm/s]</div>
              <div>L/M(t) = (L/M)_0 · (P_app(t) / P_app,0)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.payloadTitle}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t.payloadSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-sm hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? t.copied : t.copyJson}
          </button>
        </div>

        <pre className="bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed p-4 rounded overflow-auto max-h-[540px] tabular-nums">
          {jsonPayload}
        </pre>
      </div>
    </div>
  );
};
