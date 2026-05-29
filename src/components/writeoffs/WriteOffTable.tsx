import React from "react";

interface WriteOffTableProps {
  writeOffs: any[];
}

export function WriteOffTable({ writeOffs }: WriteOffTableProps) {
  return (
    <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap min-w-[700px]">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Tarix</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Məhsullar</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Səbəb</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Zərər (Məbləğ)</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">İcra Edən</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {writeOffs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  Silinmə tapılmadı
                </td>
              </tr>
            ) : (
              writeOffs.map((w) => (
                <tr key={w.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {w.date?.toDate ? w.date.toDate().toLocaleDateString("az-AZ") : ""}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {w.items?.map((item: any, idx: number) => (
                        <span key={idx} className="text-sm font-medium text-zinc-900">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{w.reason}</td>
                  <td className="px-6 py-4 font-bold text-red-600">₼{w.totalLoss.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{w.recordedBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
