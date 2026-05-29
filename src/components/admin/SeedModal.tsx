import React from "react";

interface SeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SeedModal({ isOpen, onClose, onConfirm }: SeedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative mt-auto sm:my-8 max-h-[90vh] overflow-y-auto text-left">
        <h3 className="text-xl font-bold mb-4">Demo Məlumatları Yüklə</h3>
        <p className="text-zinc-600 mb-6">
          Bütün cədvəllərə (məhsullar, kateqoriyalar, müştərilər, satışlar) demo məlumatlar əlavə ediləcək. Davam etmək istəyirsiniz?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 font-medium transition-colors"
          >
            Ləğv et
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors"
          >
            Bəli, Yüklə
          </button>
        </div>
      </div>
    </div>
  );
}
