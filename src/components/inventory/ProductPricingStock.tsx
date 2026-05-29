import React from "react";
import { Tags } from "lucide-react";

interface ProductPricingStockProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function ProductPricingStock({
  formData,
  setFormData
}: ProductPricingStockProps) {
  return (
    <div className="col-span-2">
      <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
        <Tags className="w-4 h-4" />
        Qiymət və Stok
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">Alış Qiyməti (₼)</label>
          <input
            type="number"
            step="0.01"
            value={formData.purchasePrice}
            onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">Satış Qiyməti (₼)</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">Ölçü Vahidi</label>
          <select
            value={formData.unit}
            onChange={e => setFormData({ ...formData, unit: e.target.value })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            {["ədəd", "kq", "litr", "metr", "paçka", "qutu"].map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">Mövcud Stok</label>
          <input
            type="number"
            required
            value={formData.stock}
            onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">Kritik Hədd</label>
          <input
            type="number"
            value={formData.minStock}
            onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">İl</label>
          <input
            type="number"
            required
            value={formData.year}
            onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>
    </div>
  );
}
