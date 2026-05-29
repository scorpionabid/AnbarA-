import React from "react";
import { motion } from "motion/react";
import { ShoppingBag, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  purchasePrice: number;
  stock: number;
  category: string;
  imageUrl?: string;
  imageUrls?: string[];
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((p) => (
        <motion.button
          layout
          key={p.id}
          onClick={() => onAddToCart(p)}
          className="group relative flex flex-col bg-white border border-zinc-200 rounded-[1.5rem] overflow-hidden hover:border-zinc-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left active:scale-95"
        >
          <div className="aspect-square bg-zinc-50 relative overflow-hidden">
            {(p.imageUrls?.[0] || p.imageUrl) ? (
              <img src={p.imageUrls?.[0] || p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-300">
                <ShoppingBag className="w-10 h-10" />
              </div>
            )}
            <div className="absolute top-2 left-2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
              Stok: {p.stock}
            </div>
          </div>
          
          <div className="p-4 flex-1 flex flex-col justify-between gap-2">
            <div>
              <h4 className="font-bold text-zinc-900 text-sm line-clamp-1">{p.name}</h4>
              <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">{(p as any).categoryName || p.category || "KATEQORİYASIZ"}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-zinc-900">₼{p.purchasePrice || 0}</span>
              <div className="w-8 h-8 bg-zinc-100 text-zinc-600 rounded-xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
