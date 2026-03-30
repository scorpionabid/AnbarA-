import React from "react";
import { MapPin, Warehouse as WarehouseIcon, Plus, Edit2, Trash2 } from "lucide-react";

interface StoreManagementProps {
  type: "branches" | "warehouses";
  data: any[];
}

export function StoreManagement({ type, data }: StoreManagementProps) {
  const isBranches = type === "branches";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          {isBranches ? <MapPin className="w-5 h-5 text-zinc-400" /> : <WarehouseIcon className="w-5 h-5 text-zinc-400" />}
          {isBranches ? "Filiallar" : "Anbarlar"}
        </h3>
        <button className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors text-sm">
          <Plus className="w-4 h-4" />
          {isBranches ? "Filial Əlavə Et" : "Anbar Əlavə Et"}
        </button>
      </div>
      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:shadow-sm transition-all">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isBranches ? "Filial Adı" : "Anbar Adı"}
              </th>
              {isBranches && <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Ünvan / Məkan</th>}
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-zinc-50 transition-colors group">
                <td className="px-6 py-4 font-medium text-zinc-900">{item.name}</td>
                {isBranches && <td className="px-6 py-4 text-sm text-zinc-500">{item.location}</td>}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="p-12 text-center text-zinc-500">{isBranches ? "Filial tapılmadı." : "Anbar tapılmadı."}</div>
        )}
      </div>
    </div>
  );
}
