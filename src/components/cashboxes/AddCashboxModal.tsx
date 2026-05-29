import React from "react";
import { Loader2 } from "lucide-react";

interface AddCashboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  newCashbox: any;
  setNewCashbox: (data: any) => void;
  handleAddCashbox: (e: React.FormEvent) => void;
  isProcessing: boolean;
}

export function AddCashboxModal({
  isOpen,
  onClose,
  newCashbox,
  setNewCashbox,
  handleAddCashbox,
  isProcessing
}: AddCashboxModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl">
        <h3 className="text-2xl font-bold mb-6">Yeni Kassa</h3>
        <form onSubmit={handleAddCashbox} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Kassa Adı</label>
            <input
              required
              type="text"
              value={newCashbox.name}
              onChange={(e) => setNewCashbox({ ...newCashbox, name: e.target.value })}
              className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="Məs: Əsas Kassa, Kapital Bank..."
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Kassa Növü</label>
            <select
              value={newCashbox.type}
              onChange={(e) => setNewCashbox({ ...newCashbox, type: e.target.value })}
              className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="cash">Nağd Kassa</option>
              <option value="card">POS Terminal / Kart</option>
              <option value="bank">Bank Hesabı</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">İlkin Balans (₼)</label>
            <input
              required
              type="number"
              step="0.01"
              value={newCashbox.balance}
              onChange={(e) => setNewCashbox({ ...newCashbox, balance: e.target.value })}
              className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="0.00"
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
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Əlavə Et"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
