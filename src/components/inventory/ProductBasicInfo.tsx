import React from "react";
import { Package } from "lucide-react";

interface ProductBasicInfoProps {
  formData: any;
  setFormData: (data: any) => void;
  categories: any[];
  allProductNames: string[];
}

export function ProductBasicInfo({
  formData,
  setFormData,
  categories,
  allProductNames
}: ProductBasicInfoProps) {
  return (
    <div className="col-span-2">
      <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
        <Package className="w-4 h-4" />
        Əsas Məlumatlar
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs font-bold text-zinc-400 uppercase">Məhsulun Adı</label>
          <input
            required
            list="product-names"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <datalist id="product-names">
            {allProductNames.map(name => <option key={name} value={name} />)}
          </datalist>
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">SKU / Kod</label>
          <input
            required
            value={formData.sku}
            onChange={e => setFormData({ ...formData, sku: e.target.value })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">Barkod</label>
          <input
            value={formData.barcode}
            onChange={e => setFormData({ ...formData, barcode: e.target.value })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">Kateqoriya</label>
          <select
            value={formData.categoryId}
            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">Seçin</option>
            {categories
              .filter((c) => !c.parentId)
              .map((mainCat) => {
                const subCats = categories.filter((sc) => sc.parentId === mainCat.id);
                if (subCats.length > 0) {
                  return (
                    <optgroup key={mainCat.id} label={mainCat.name}>
                      <option value={mainCat.id}>{mainCat.name} (Ümumi)</option>
                      {subCats.map((subCat) => (
                        <option key={subCat.id} value={subCat.id}>
                          {subCat.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                } else {
                  return (
                    <option key={mainCat.id} value={mainCat.id}>
                      {mainCat.name}
                    </option>
                  );
                }
              })}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase">Brend</label>
          <input
            value={formData.brand}
            onChange={e => setFormData({ ...formData, brand: e.target.value })}
            className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>
    </div>
  );
}
