import React from "react";
import { DollarSign, TrendingUp, ShoppingCart, Activity, ArrowUpRight } from "lucide-react";

interface StatsGridProps {
  stats: {
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    profitMargin: number;
    avgOrderValue: number;
    onlineSales: number;
    offlineSales: number;
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-3xl border border-zinc-100 hover:shadow-sm transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-zinc-900" />
          </div>
          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            12%
          </span>
        </div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Cəmi Gəlir</p>
        <h3 className="text-2xl font-black text-zinc-900 mt-1">₼{stats.totalRevenue.toLocaleString()}</h3>
        <div className="mt-4 flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-zinc-500">Onlayn: ₼{stats.onlineSales.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
            <span className="text-zinc-500">Mağaza: ₼{stats.offlineSales.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-zinc-100 hover:shadow-sm transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-zinc-900" />
          </div>
          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            8%
          </span>
        </div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Xalis Mənfəət</p>
        <h3 className="text-2xl font-black text-zinc-900 mt-1">₼{stats.totalProfit.toLocaleString()}</h3>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-zinc-100 hover:shadow-sm transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-zinc-900" />
          </div>
          <span className="flex items-center gap-1 text-zinc-400 text-xs font-bold bg-zinc-50 px-2 py-1 rounded-lg">
            Stabil
          </span>
        </div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Sifariş Sayı</p>
        <h3 className="text-2xl font-black text-zinc-900 mt-1">{stats.totalOrders}</h3>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-zinc-100 hover:shadow-sm transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-zinc-900" />
          </div>
          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
            {stats.profitMargin.toFixed(1)}%
          </span>
        </div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Mənfəət Marjası</p>
        <h3 className="text-2xl font-black text-zinc-900 mt-1">₼{stats.avgOrderValue.toFixed(2)} <span className="text-xs font-medium text-zinc-400">/ orta</span></h3>
      </div>
    </div>
  );
}
