import React from "react";
import { Wallet, Landmark, CreditCard, Trash2 } from "lucide-react";
import { canManageStoreData } from "../../lib/permissions";

interface CashboxCardsProps {
  cashboxes: any[];
  totalBalance: number;
  user: any;
  handleDeleteCashbox: (id: string) => void;
}

export function CashboxCards({ cashboxes, totalBalance, user, handleDeleteCashbox }: CashboxCardsProps) {
  const getCashboxIcon = (type: string) => {
    switch (type) {
      case "bank": return <Landmark className="w-5 h-5" />;
      case "card": return <CreditCard className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between min-w-0">
        <div className="flex items-center gap-3 mb-4 text-zinc-400">
          <Wallet className="w-5 h-5 shrink-0" />
          <span className="font-medium truncate">Ümumi Balans</span>
        </div>
        <p className="text-3xl font-bold truncate">₼{totalBalance.toFixed(2)}</p>
      </div>
      
      {cashboxes.map(cashbox => (
        <div key={cashbox.id} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between relative group min-w-0">
          {canManageStoreData(user, user.storeId) && (
            <button 
              onClick={() => handleDeleteCashbox(cashbox.id)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-3 mb-4 text-zinc-500 pr-8">
            <div className="shrink-0">
               {getCashboxIcon(cashbox.type)}
            </div>
            <span className="font-medium truncate" title={cashbox.name}>{cashbox.name}</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 truncate" title={`₼${cashbox.balance.toFixed(2)}`}>₼{cashbox.balance.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
