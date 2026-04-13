"use client";

import { Cpu } from "lucide-react";
import { providers, modes } from "../constants";

interface ModelSelectorProps {
  label?: string;
  provider: string;
  setProvider: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  showMode?: boolean;
  mode?: string;
  setMode?: (v: string) => void;
  provider2?: string;
  setProvider2?: (v: string) => void;
  model2?: string;
  setModel2?: (v: string) => void;
}

export default function ModelSelector({
  label,
  provider,
  setProvider,
  model,
  setModel,
  showMode,
  mode,
  setMode,
  provider2,
  setProvider2,
  model2,
  setModel2,
}: ModelSelectorProps) {
  const currentProvider = providers.find((p) => p.id === provider);
  const currentProvider2 = providers.find((p) => p.id === provider2);

  const selectClass =
    "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C6914C]";

  return (
    <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Cpu size={14} className="text-[#C6914C]" />
        <h4 className="font-bold text-[#C6914C] text-sm">
          {label || "إعدادات النموذج"}
        </h4>
      </div>

      {showMode && setMode && (
        <div>
          <label className="block text-xs text-[#5A5A62] mb-2">
            وضع التشغيل
          </label>
          <div className="space-y-1">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={
                  "w-full text-right px-3 py-2 rounded-lg text-sm transition " +
                  (mode === m.id
                    ? "bg-[#C6914C]/20 border border-[rgba(198,145,76,0.2)] text-[#C6914C]"
                    : "bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] text-[#9A9AA0] hover:text-white")
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-xs text-[#5A5A62] hidden sm:inline">
                    {m.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-[#5A5A62] mb-2">
          {mode === "chain"
            ? "شركة النموذج الكاتب"
            : mode === "compare"
              ? "شركة النموذج الأول"
              : "مزود الخدمة"}
        </label>
        <select
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value);
            const prov = providers.find((p) => p.id === e.target.value);
            if (prov) setModel(prov.models[0].id);
          }}
          className={selectClass}
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.desc}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-[#5A5A62] mb-2">
          {mode === "chain"
            ? "النموذج الكاتب"
            : mode === "compare"
              ? "النموذج الأول"
              : "النموذج"}
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className={selectClass}
        >
          {currentProvider?.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.desc}
            </option>
          ))}
        </select>
      </div>

      {(mode === "chain" || mode === "compare") &&
        setProvider2 &&
        setModel2 && (
          <>
            <div className="border-t border-[rgba(198,145,76,0.15)] pt-3">
              <label className="block text-xs text-[#5A5A62] mb-2">
                {mode === "chain"
                  ? "شركة النموذج المراجع"
                  : "شركة النموذج الثاني"}
              </label>
              <select
                value={provider2}
                onChange={(e) => {
                  setProvider2(e.target.value);
                  const prov = providers.find((p) => p.id === e.target.value);
                  if (prov) setModel2(prov.models[0].id);
                }}
                className={selectClass}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.desc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#5A5A62] mb-2">
                {mode === "chain"
                  ? "النموذج المراجع"
                  : "النموذج الثاني"}
              </label>
              <select
                value={model2}
                onChange={(e) => setModel2(e.target.value)}
                className={selectClass}
              >
                {currentProvider2?.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.desc}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
    </div>
  );
}
