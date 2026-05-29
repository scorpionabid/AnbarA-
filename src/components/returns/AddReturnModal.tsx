import React from "react";
import { Search, Loader2 } from "lucide-react";

interface AddReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  newReturn: any;
  setNewReturn: (data: any) => void;
  handleSubmitReturn: (e: React.FormEvent) => void;
  isProcessing: boolean;
  productSearch: string;
  setProductSearch: (query: string) => void;
  filteredProducts: any[];
  handleAddItem: (product: any) => void;
  returnItems: any[];
  updateItemQuantity: (id: string, qty: number) => void;
  calculateTotal: () => number;
}

export function AddReturnModal({
  isOpen,
  onClose,
  newReturn,
  setNewReturn,
  handleSubmitReturn,
  isProcessing,
  productSearch,
  setProductSearch,
  filteredProducts,
  handleAddItem,
  returnItems,
  updateItemQuantity,
  calculateTotal
}: AddReturnModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6">Yeni Qaytarılma</h3>
        <form onSubmit={handleSubmitReturn} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase">Qaytarılma Növü</label>
              <select
                value={newReturn.type}
                onChange={(e) => {
                  setNewReturn({ ...newReturn, type: e.target.value });
                }}
                className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="customer_return">Müştəri Qaytarması (Anbara Giriş)</option>
                <option value="supplier_return">Zavoda/Təchizatçıya Qaytarma (Anbardan Çıxış)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase">Sənəd / Çek Nömrəsi (İstəyə bağlı)</label>
              <input
                type="text"
                value={newReturn.originalTransactionId}
                onChange={(e) => setNewReturn({ ...newReturn, originalTransactionId: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="Məs: INV-2026-001"
              />
            </div>
          </div>

          {/* Product Search */}
          <div className="relative">
            <label className="text-xs font-bold text-zinc-400 uppercase">Məhsul Axtar</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="Məhsul adı və ya barkod..."
              />
            </div>
            {filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddItem(p)}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-50 flex justify-between items-center border-b border-zinc-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">{p.name}</p>
                      <p className="text-xs text-zinc-500">Stok: {p.stock} • Barkod: {p.barcode || "Yoxdur"}</p>
                    </div>
                    <span className="font-bold text-zinc-900">
                      ₼{newReturn.type === "customer_return" ? p.price : (p.purchasePrice || 0)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Items */}
          {returnItems.length > 0 && (
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4">
              <h4 className="text-sm font-bold text-zinc-900 mb-3">Seçilmiş Məhsullar</h4>
              <div className="space-y-3">
                {returnItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-4 bg-white p-3 rounded-lg border border-zinc-100">
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-500">Qiymət: ₼{item.price}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                      <span className="font-bold text-zinc-900 w-20 text-right">
                        ₼{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-200 flex justify-between items-center">
                <span className="font-bold text-zinc-900">Yekun Məbləğ:</span>
                <span className="text-xl font-bold text-zinc-900">₼{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Qaytarılma Səbəbi</label>
            <textarea
              value={newReturn.reason}
              onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
              className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
              rows={2}
              placeholder="Məs: Defekt, Vaxtı keçib, Səhv sifariş..."
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
              disabled={isProcessing || returnItems.length === 0}
              className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Təsdiqlə"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
