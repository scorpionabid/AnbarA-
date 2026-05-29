import React from "react";
import { Package, Edit2, Trash2, TrendingUp } from "lucide-react";
import { cn } from "../../lib/utils";

interface InventoryProductsProps {
  products: any[];
  selectedProductIds: string[];
  toggleSelectAll: () => void;
  toggleSelectProduct: (id: string) => void;
  handleBulkDelete: () => void;
  handleBulkPriceUpdate: () => void;
  setSelectedProductIds: (ids: string[]) => void;
  canManage: boolean;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
}

export function InventoryProducts({
  products,
  selectedProductIds,
  toggleSelectAll,
  toggleSelectProduct,
  handleBulkDelete,
  handleBulkPriceUpdate,
  setSelectedProductIds,
  canManage,
  onEdit,
  onDelete
}: InventoryProductsProps) {
  return (
    <div className="space-y-4">
      {selectedProductIds.length > 0 && (
        <div className="bg-zinc-900 text-white p-4 rounded-2xl flex justify-between items-center animate-in slide-in-from-top-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold">{selectedProductIds.length} məhsul seçilib</span>
            <button 
              onClick={() => setSelectedProductIds([])}
              className="text-xs text-zinc-400 hover:text-white underline"
            >
              Seçimi ləğv et
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkPriceUpdate}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Qiymət Yenilə
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Seçilənləri Sil
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:shadow-sm transition-all overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-zinc-50 border-bottom border-zinc-200">
            <tr>
              <th className="px-6 py-4 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  checked={selectedProductIds.length === products.length && products.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Məhsul</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">SKU / Barkod</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Kateqoriya</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Qiymət (Alış/Satış)</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Stok</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.map((p) => (
              <tr key={p.id} className={cn(
                "hover:bg-zinc-50 transition-colors",
                selectedProductIds.includes(p.id) && "bg-zinc-50"
              )}>
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    checked={selectedProductIds.includes(p.id)}
                    onChange={() => toggleSelectProduct(p.id)}
                  />
                </td>
                <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {(p.imageUrls?.[0] || p.imageUrl) ? (
                    <img src={p.imageUrls?.[0] || p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-zinc-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200">
                      <Package className="w-5 h-5 text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-zinc-900">{p.name}</div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{p.brand || "Brendsiz"} • {p.location || "Yer yoxdur"}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-500 font-mono">{p.sku}</div>
                <div className="text-[10px] text-zinc-400 font-mono">{p.barcode || "Barkod yoxdur"}</div>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-500">{p.categoryName || "Kateqoriyasız"}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-zinc-900">₼{p.price}</div>
                {p.purchasePrice > 0 && (
                  <div className="text-[10px] text-zinc-400">
                    Alış: ₼{p.purchasePrice} 
                    <span className="text-emerald-500 ml-1">
                      (+{(((p.price - p.purchasePrice) / p.purchasePrice) * 100).toFixed(0)}%)
                    </span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                  p.stock <= 0 
                    ? "bg-red-500 text-white shadow-sm shadow-red-200" 
                    : p.stock < (p.minStock ?? 10) 
                      ? "bg-orange-100 text-orange-600" 
                      : "bg-emerald-100 text-emerald-600"
                )}>
                  {p.stock} {p.unit || "ədəd"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {canManage && (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && (
        <div className="p-12 text-center text-zinc-500">Məlumat tapılmadı.</div>
      )}
    </div>
  </div>
  );
}
