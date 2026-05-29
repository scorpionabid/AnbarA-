import React from "react";
import { Plus, Wallet, History, Loader2, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { cn } from "../../lib/utils";

interface DebtDetailsProps {
  selectedClient: any;
  history: any[];
  historyLoading: boolean;
  onOpenPaymentModal: () => void;
}

export function DebtDetails({ selectedClient, history, historyLoading, onOpenPaymentModal }: DebtDetailsProps) {
  if (!selectedClient) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-12 text-center">
        <Wallet className="w-16 h-16 mb-4 opacity-10" />
        <h3 className="font-bold text-lg text-zinc-900">Müştəri Seçilməyib</h3>
        <p className="text-sm mt-2">Borc tarixçəsini görmək və ödəniş qəbul etmək üçün soldan bir müştəri seçin.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 border-b border-zinc-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900">{selectedClient.name}</h3>
            <p className="text-zinc-500 text-sm">{selectedClient.phone || "Əlaqə nömrəsi yoxdur"}</p>
          </div>
          <button 
            onClick={onOpenPaymentModal}
            className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ödəniş Al
          </button>
        </div>

        <div className="bg-zinc-50 p-6 rounded-3xl flex justify-between items-center">
          <span className="text-zinc-500 font-medium">Cari Borc</span>
          <span className="text-3xl font-black text-red-600">₼{selectedClient.debt}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-4 h-4 text-zinc-400" />
          <h4 className="font-bold text-zinc-900">Son Əməliyyatlar</h4>
        </div>

        {historyLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zinc-300" /></div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  item.type === "sale" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {item.type === "sale" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold text-sm text-zinc-900 truncate">
                      {item.type === "sale" ? "Nisyə Satış" : "Borc Ödənişi"}
                    </h5>
                    <span className={cn(
                      "font-black text-sm",
                      item.type === "sale" ? "text-red-600" : "text-emerald-600"
                    )}>
                      {item.type === "sale" ? "+" : "-"}₼{item.type === "sale" ? item.totalAmount : item.amount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    <Clock className="w-3 h-3" />
                    {item.createdAt?.toDate().toLocaleString('az-AZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {item.note && (
                    <p className="mt-2 text-xs text-zinc-500 italic bg-zinc-50 p-2 rounded-lg">"{item.note}"</p>
                  )}
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-center text-zinc-400 py-8 text-sm">Əməliyyat tarixçəsi yoxdur.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
