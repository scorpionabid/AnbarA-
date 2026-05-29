import React from "react";
import { AlertTriangle } from "lucide-react";

interface WriteOffStatsProps {
  totalLossAmount: number;
}

export function WriteOffStats({ totalLossAmount }: WriteOffStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-500">Ümumi Zərər (Göstərilən)</p>
          <p className="text-2xl font-bold text-zinc-900">₼{totalLossAmount.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
