import React from "react";
import { History } from "lucide-react";
import { cn } from "../../lib/utils";

interface RecentSalesTableProps {
  sales: any[];
}

export function RecentSalesTable({ sales }: RecentSalesTableProps) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-100 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-zinc-400" />
        <h3 className="text-lg font-bold">Son Satışlar</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap min-w-[600px]">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Tarix</th>
              <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Müştəri</th>
              <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Ödəniş</th>
              <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Məbləğ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {sales.length > 0 ? (
              sales.slice(0, 10).map((sale, i) => (
                <tr key={i} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="py-4 text-sm text-zinc-500">
                    {sale.createdAt?.toDate().toLocaleString('az-AZ', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="py-4 text-sm font-medium text-zinc-900">
                    {sale.clientName || "Standart Müştəri"}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        sale.paymentMethod === 'cash' ? "bg-emerald-400" : 
                        sale.paymentMethod === 'card' ? "bg-blue-400" : "bg-orange-400"
                      )} />
                      <span className="text-xs text-zinc-600 uppercase font-medium">
                        {sale.paymentMethod === 'cash' ? 'Nağd' : sale.paymentMethod === 'card' ? 'Kart' : 'Nisyə'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right font-bold text-zinc-900">
                    ₼{sale.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-zinc-400">Məlumat tapılmadı</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
