import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface TransactionTableProps {
  transactions: any[];
  getCashboxName: (id: string) => string;
}

export function TransactionTable({ transactions, getCashboxName }: TransactionTableProps) {
  return (
    <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap min-w-[700px]">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Tarix</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Növ</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Kassa</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Məbləğ</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Qeyd</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">İcra Edən</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  Əməliyyat tapılmadı
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {tx.date?.toDate ? tx.date.toDate().toLocaleDateString("az-AZ") : ""}
                  </td>
                  <td className="px-6 py-4">
                    {tx.type === "income" ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold w-max">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        Mədaxil
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold w-max">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Məxaric
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{getCashboxName(tx.cashboxId)}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">₼{tx.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{tx.description || "-"}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{tx.recordedBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
