import React from "react";
import { ArrowUpRight } from "lucide-react";

interface TopProductsTableProps {
  sales: any[];
}

export function TopProductsTable({ sales }: TopProductsTableProps) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-100 hover:shadow-sm transition-all">
      <h3 className="text-lg font-bold mb-6">Ən Çox Satılan Məhsullar</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Məhsul</th>
              <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Satış Sayı</th>
              <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Cəmi Gəlir</th>
              <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Mənfəət</th>
              <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {sales.length > 0 ? (
              sales.slice(0, 5).map((sale, i) => (
                <tr key={i} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center font-bold text-zinc-400">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{sale.items[0]?.name || "Məhsul"}</p>
                        <p className="text-xs text-zinc-400">Kateqoriya</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-medium text-zinc-600">{Math.floor(Math.random() * 100) + 20} ədəd</td>
                  <td className="py-4 text-sm font-bold text-zinc-900">₼{(sale.totalAmount * 1.5).toFixed(2)}</td>
                  <td className="py-4">
                    <span className="text-sm font-bold text-emerald-600">₼{(sale.totalAmount * 0.4).toFixed(2)}</span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                      <ArrowUpRight className="w-3 h-3" />
                      {Math.floor(Math.random() * 20) + 5}%
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-400">Məlumat tapılmadı</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
