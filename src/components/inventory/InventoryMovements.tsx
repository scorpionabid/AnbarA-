import React from "react";
import { cn } from "../../lib/utils";

interface InventoryMovementsProps {
  logs: any[];
  logFilterType: string;
  setLogFilterType: (type: string) => void;
}

export function InventoryMovements({ logs, logFilterType, setLogFilterType }: InventoryMovementsProps) {
  return (
    <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:shadow-sm transition-all">
      <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
        <h4 className="text-sm font-bold text-zinc-900">Son Hərəkətlər</h4>
        <div className="flex gap-2">
          {["all", "create", "update", "delete"].map((type) => (
            <button
              key={type}
              onClick={() => setLogFilterType(type)}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                logFilterType === type 
                ? "bg-zinc-900 text-white" 
                : "bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
              )}
            >
              {type === "all" ? "Hamısı" : type === "create" ? "Yaradıldı" : type === "delete" ? "Silindi" : "Yeniləndi"}
            </button>
          ))}
        </div>
      </div>
      <table className="w-full text-left">
        <thead className="bg-zinc-50 border-bottom border-zinc-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Tarix</th>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Məhsul</th>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Növ</th>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Dəyişiklik</th>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">İstifadəçi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
              <td className="px-6 py-4 text-sm text-zinc-500">
                {log.timestamp?.toDate().toLocaleString('az-AZ')}
              </td>
              <td className="px-6 py-4 font-medium text-zinc-900">{log.productName}</td>
              <td className="px-6 py-4">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                  log.type === "create" ? "bg-blue-100 text-blue-600" :
                  log.type === "delete" ? "bg-red-100 text-red-600" :
                  "bg-amber-100 text-amber-600"
                )}>
                  {log.type === "create" ? "Yaradıldı" : log.type === "delete" ? "Silindi" : "Yeniləndi"}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={cn(
                  "font-bold",
                  log.change > 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {log.change > 0 ? `+${log.change}` : log.change}
                </span>
                <span className="text-xs text-zinc-400 ml-2">
                  ({log.oldStock} → {log.newStock})
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-500">{log.userEmail}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && (
        <div className="p-12 text-center text-zinc-500">Hərəkət tapılmadı.</div>
      )}
    </div>
  );
}
