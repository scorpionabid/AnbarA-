import React from "react";
import { FileText } from "lucide-react";

interface ProductExtraInfoProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function ProductExtraInfo({
  formData,
  setFormData
}: ProductExtraInfoProps) {
  return (
    <div className="col-span-2">
      <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Əlavə Məlumatlar
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">Son İstifadə Tarixi</label>
          <input
            type="date"
            value={formData.expiryDate}
            onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">Anbardakı Yeri</label>
          <input
            placeholder="Məs: Rəf A-1"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-bold text-zinc-400 uppercase">Təsvir</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
