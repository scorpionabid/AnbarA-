import React from "react";
import { ArrowRight, AlertCircle } from "lucide-react";

interface ImportFieldMapperProps {
  REQUIRED_FIELDS: any[];
  OPTIONAL_FIELDS: any[];
  mapping: Record<string, string>;
  setMapping: (mapping: Record<string, string>) => void;
  headers: string[];
}

export function ImportFieldMapper({ REQUIRED_FIELDS, OPTIONAL_FIELDS, mapping, setMapping, headers }: ImportFieldMapperProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          Faylınızdakı sütunları sistemdəki müvafiq sahələrlə uyğunlaşdırın. 
          Məcburi sahələrin seçilməsi mütləqdir.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h4 className="font-bold text-zinc-900 mb-4 border-b pb-2">Məcburi Sahələr</h4>
          <div className="space-y-3">
            {REQUIRED_FIELDS.map(field => (
              <div key={field.key} className="flex items-center gap-4">
                <div className="w-1/3 text-sm font-medium text-zinc-700">
                  {field.label} <span className="text-red-500">*</span>
                </div>
                <div className="w-8 flex justify-center text-zinc-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <select
                    value={mapping[field.key] || ""}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="">-- Sütun seçin --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-zinc-900 mb-4 border-b pb-2">İxtiyari Sahələr</h4>
          <div className="space-y-3">
            {OPTIONAL_FIELDS.map(field => (
              <div key={field.key} className="flex items-center gap-4">
                <div className="w-1/3 text-sm font-medium text-zinc-700">
                  {field.label}
                </div>
                <div className="w-8 flex justify-center text-zinc-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <select
                    value={mapping[field.key] || ""}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="">-- Sütun seçin --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
