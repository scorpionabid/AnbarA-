import React from "react";
import { Package, AlertTriangle, History, Tags, Search } from "lucide-react";
import { cn } from "../../lib/utils";

interface InventoryTabsProps {
  activeTab: "products" | "low_stock" | "movements" | "categories";
  setActiveTab: (tab: "products" | "low_stock" | "movements" | "categories") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  filterBrand: string;
  setFilterBrand: (brand: string) => void;
  categories: any[];
  brands: string[];
}

export function InventoryTabs({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  filterBrand,
  setFilterBrand,
  categories,
  brands
}: InventoryTabsProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("products")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "products" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <Package className="w-4 h-4" />
          Məhsullar
        </button>
        <button
          onClick={() => setActiveTab("low_stock")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "low_stock" ? "bg-white text-red-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Kritik Stok
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "movements" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <History className="w-4 h-4" />
          Hərəkətlər
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "categories" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <Tags className="w-4 h-4" />
          Kateqoriyalar
        </button>
      </div>

      {activeTab === "products" && (
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Axtar (Ad, SKU, Barkod)..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold"
          >
            <option value="Hamısı">Bütün Kateqoriyalar</option>
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
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold"
          >
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
