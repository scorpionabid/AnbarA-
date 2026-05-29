import React from "react";
import { Package, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

interface InventoryStatsProps {
  stats: {
    totalItems: number;
    totalValue: number;
    totalSaleValue: number;
    potentialProfit: number;
    lowStock: number;
  };
}

export function InventoryStats({ stats }: InventoryStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
          <Package className="w-6 h-6 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider truncate" title="Ümumi Məhsul">Ümumi Məhsul</p>
          <h3 className="text-2xl font-black text-zinc-900 truncate" title={stats.totalItems.toString()}>{stats.totalItems}</h3>
        </div>
      </div>
      <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
          <DollarSign className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider truncate" title="Anbar Dəyəri">Anbar Dəyəri</p>
          <h3 className="text-2xl font-black text-zinc-900 truncate" title={`₼${stats.totalValue.toLocaleString()}`}>₼{stats.totalValue.toLocaleString()}</h3>
        </div>
      </div>
      <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider truncate" title="Potensial Satış">Potensial Satış</p>
          <h3 className="text-2xl font-black text-zinc-900 truncate" title={`₼${stats.totalSaleValue.toLocaleString()}`}>₼{stats.totalSaleValue.toLocaleString()}</h3>
        </div>
      </div>
      <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider truncate" title="Potensial Qazanc">Potensial Qazanc</p>
          <h3 className="text-2xl font-black text-zinc-900 truncate" title={`₼${stats.potentialProfit.toLocaleString()}`}>₼{stats.potentialProfit.toLocaleString()}</h3>
        </div>
      </div>
      <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider truncate" title="Kritik Stok">Kritik Stok</p>
          <h3 className="text-2xl font-black text-zinc-900 truncate" title={stats.lowStock.toString()}>{stats.lowStock}</h3>
        </div>
      </div>
    </div>
  );
}
