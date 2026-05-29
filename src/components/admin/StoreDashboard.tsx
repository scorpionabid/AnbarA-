import React from "react";
import { Users, Package } from "lucide-react";

interface StoreDashboardProps {
  stores: any[];
}

export function StoreDashboard({ stores }: StoreDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => (
        <div key={store.id} className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <h3 className="text-lg font-bold text-zinc-900 mb-2">{store.name}</h3>
          
          <div className="mb-4">
            <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Adminlər</p>
            <div className="space-y-1">
              {store.admins && store.admins.length > 0 ? (
                store.admins.map((admin: any, idx: number) => (
                  <div key={idx} className="text-sm text-zinc-600 flex flex-col">
                    <span className="font-medium">{admin.name}</span>
                    <span className="text-xs text-zinc-400">{admin.email}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 italic">Admin təyin edilməyib</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">İstifadəçi</span>
              </div>
              <p className="text-2xl font-bold text-zinc-900">{store.userCount}</p>
            </div>
            <div className="bg-zinc-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <Package className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Məhsul Növü</span>
              </div>
              <p className="text-2xl font-bold text-zinc-900">{store.productVariety}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
