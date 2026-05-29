import React, { useState } from "react";
import { X, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface BulkPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: "percentage" | "fixed", value: number, action: "increase" | "decrease") => void;
  selectedCount: number;
}

export function BulkPriceModal({ isOpen, onClose, onConfirm, selectedCount }: BulkPriceModalProps) {
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [action, setAction] = useState<"increase" | "decrease">("increase");
  const [value, setValue] = useState<string>("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-zinc-400" />
            Toplu Qiymət Yeniləmə
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-sm text-zinc-600">
              Seçilmiş <span className="font-bold text-zinc-900">{selectedCount}</span> məhsulun satış qiymətini dəyişmək üçün aşağıdakı parametrləri seçin.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
              <button
                onClick={() => setAction("increase")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                  action === "increase" ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <TrendingUp className="w-4 h-4" />
                Artır
              </button>
              <button
                onClick={() => setAction("decrease")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                  action === "decrease" ? "bg-white text-red-600 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <TrendingDown className="w-4 h-4" />
                Azalt
              </button>
            </div>

            <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
              <button
                onClick={() => setType("percentage")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                  type === "percentage" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <Percent className="w-4 h-4" />
                Faizlə
              </button>
              <button
                onClick={() => setType("fixed")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                  type === "fixed" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <DollarSign className="w-4 h-4" />
                Məbləğlə
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === "percentage" ? "Faiz daxil edin (məs: 10)" : "Məbləğ daxil edin (məs: 5)"}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-bold"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                {type === "percentage" ? "%" : "₼"}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
            >
              Ləğv et
            </button>
            <button
              onClick={() => onConfirm(type, parseFloat(value) || 0, action)}
              disabled={!value || parseFloat(value) <= 0}
              className="flex-2 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Yenilə
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
