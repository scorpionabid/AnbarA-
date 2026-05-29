import React from "react";
import { X, Loader2 } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: any;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  paymentNote: string;
  setPaymentNote: (note: string) => void;
  handlePayment: (e: React.FormEvent) => void;
  isProcessing: boolean;
  cashboxes?: any[];
  selectedCashbox?: string;
  setSelectedCashbox?: (id: string) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  selectedClient,
  paymentAmount,
  setPaymentAmount,
  paymentNote,
  setPaymentNote,
  handlePayment,
  isProcessing,
  cashboxes = [],
  selectedCashbox,
  setSelectedCashbox
}: PaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative mt-auto sm:my-8 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-bold mb-2">Ödəniş Qəbulu</h3>
        <p className="text-zinc-500 text-sm mb-6">{selectedClient?.name} tərəfindən edilən ödəniş.</p>
        
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Məbləğ (₼)</label>
            <input
              required
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xl font-black focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          {cashboxes && cashboxes.length > 0 && setSelectedCashbox && (
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase">Ödənişin daxil olacağı kassa</label>
              <select
                required
                value={selectedCashbox || ""}
                onChange={(e) => setSelectedCashbox(e.target.value)}
                className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">Kassa seçin</option>
                {cashboxes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.balance.toFixed(2)} ₼)</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Qeyd (Könüllü)</label>
            <textarea
              value={paymentNote}
              onChange={e => setPaymentNote(e.target.value)}
              placeholder="Ödəniş haqqında qeyd..."
              className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isProcessing}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : "Ödənişi Təsdiqlə"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
