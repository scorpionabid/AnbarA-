import React from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface ReturnsTableProps {
  returns: any[];
}

export function ReturnsTable({ returns }: ReturnsTableProps) {
  return (
    <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap min-w-[800px]">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Tarix</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Növ</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Məhsullar</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Məbləğ</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Qeyd Edən</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  Qaytarılma tapılmadı
                </td>
              </tr>
            ) : (
              returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {ret.date?.toDate ? ret.date.toDate().toLocaleDateString("az-AZ") : ""}
                  </td>
                  <td className="px-6 py-4">
                    {ret.type === "customer_return" ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold w-max">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        Müştəri Qaytarması (Anbara Giriş)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-bold w-max">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Zavoda Qaytarma (Anbardan Çıxış)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {ret.items?.map((item: any, idx: number) => (
                        <span key={idx} className="text-sm font-medium text-zinc-900">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-zinc-900">₼{ret.totalRefund.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{ret.recordedBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
