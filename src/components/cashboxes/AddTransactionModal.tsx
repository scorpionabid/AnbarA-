import React from "react";
import { Loader2 } from "lucide-react";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTransaction: any;
  setNewTransaction: (data: any) => void;
  handleAddTransaction: (e: React.FormEvent) => void;
  isProcessing: boolean;
  cashboxes: any[];
}

export function AddTransactionModal({
  isOpen,
  onClose,
  newTransaction,
  setNewTransaction,
  handleAddTransaction,
  isProcessing,
  cashboxes
}: AddTransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl">
        <h3 className="text-2xl font-bold mb-6">Mədaxil / Məxaric</h3>
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Əməliyyat Növü</label>
            <select
              value={newTransaction.type}
              onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
              className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="income">Mədaxil (Kassaya pul girişi)</option>
              <option value="expense">Məxaric (Kassadan pul çıxışı)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Kassa</label>
            <select
              required
              value={newTransaction.cashboxId}
              onChange={(e) => setNewTransaction({ ...newTransaction, cashboxId: e.target.value })}
              className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              {cashboxes.map(c => (
                <option key={c.id} value={c.id}>{c.name} (Balans: ₼{c.balance.toFixed(2)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Məbləğ (₼)</label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Qeyd</label>
            <textarea
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
              rows={2}
              placeholder="Əməliyyatın məqsədi..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 font-medium transition-colors"
            >
              Ləğv et
            </button>
            <button
              type="submit"
              disabled={isProcessing || cashboxes.length === 0}
              className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Təsdiqlə"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
