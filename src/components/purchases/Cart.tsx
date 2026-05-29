import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Search, Package, Minus, Plus, X, Save, ChevronRight, Loader2, Users, History } from "lucide-react";
import { cn } from "../../lib/utils";

interface CartItem {
  id: string;
  name: string;
  purchasePrice: number;
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  filteredCart: CartItem[];
  cartSearchQuery: string;
  setCartSearchQuery: (query: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  updatePurchasePrice: (id: string, price: number) => void;
  removeFromCart: (id: string) => void;
  subtotal: number;
  totalAmount: number;
  discount: number;
  setDiscount: (val: number) => void;
  discountType: "fixed" | "percentage";
  setDiscountType: (type: "fixed" | "percentage") => void;
  tax: number;
  setTax: (val: number) => void;
  paymentMethod: "cash" | "card" | "credit";
  setPaymentMethod: (method: "cash" | "card" | "credit") => void;
  isProcessing: boolean;
  onSaveDraft: () => void;
  onCompletePurchase: () => void;
  selectedSupplier: any;
  onOpenSupplierModal: () => void;
  recentPurchases: any[];
  cashboxes?: any[];
  selectedCashbox?: string;
  setSelectedCashbox?: (id: string) => void;
}

export function Cart({
  cart,
  filteredCart,
  cartSearchQuery,
  setCartSearchQuery,
  updateQuantity,
  updatePurchasePrice,
  removeFromCart,
  subtotal,
  totalAmount,
  discount,
  setDiscount,
  discountType,
  setDiscountType,
  tax,
  setTax,
  paymentMethod,
  setPaymentMethod,
  isProcessing,
  onSaveDraft,
  onCompletePurchase,
  selectedSupplier,
  onOpenSupplierModal,
  recentPurchases,
  cashboxes = [],
  selectedCashbox,
  setSelectedCashbox
}: CartProps) {
  return (
    <div className="w-full flex flex-col bg-white border border-zinc-100 rounded-[2rem] text-zinc-900 p-6 shadow-sm relative overflow-hidden min-h-[400px]">
      <div className="relative flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-zinc-400" />
            <h3 className="font-medium text-lg">Alış Səbəti</h3>
          </div>
          <span className="bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-500">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} ədəd
          </span>
        </div>

        {cart.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
            <input
              value={cartSearchQuery}
              onChange={(e) => setCartSearchQuery(e.target.value)}
              placeholder="Səbətdə axtar..."
              className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-zinc-100 text-xs focus:outline-none focus:border-zinc-300 transition-all text-zinc-900 placeholder:text-zinc-400"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-6 max-h-[300px]">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3 py-12">
                <Package className="w-10 h-10 text-zinc-200" />
                <p className="text-xs font-medium">Səbət boşdur</p>
              </div>
            ) : filteredCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3 py-12">
                <Search className="w-10 h-10 text-zinc-200" />
                <p className="text-xs font-medium">Nəticə tapılmadı</p>
              </div>
            ) : (
              filteredCart.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key={item.id}
                  className="group flex items-center justify-between py-3 border-b border-zinc-50 last:border-0"
                >
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-sm text-zinc-900 line-clamp-1">{item.name}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-zinc-400 text-xs">₼</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.purchasePrice || ''}
                        onChange={(e) => updatePurchasePrice(item.id, parseFloat(e.target.value) || 0)}
                        className="bg-transparent border-b border-zinc-200 text-zinc-900 text-xs w-16 focus:outline-none focus:border-zinc-900"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-zinc-50 rounded-lg p-1 border border-zinc-100/50">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-white rounded-md transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-medium text-xs text-zinc-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-white rounded-md transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-semibold text-sm text-zinc-900 w-16 text-right">₼{((item.purchasePrice || 0) * item.quantity).toFixed(2)}</span>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-5">
          <div className="flex p-1 bg-zinc-50 rounded-xl border border-zinc-100">
            <button onClick={() => setPaymentMethod("cash")} className={cn("flex-1 py-1.5 text-xs font-medium rounded-lg transition-all", paymentMethod === "cash" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>Nağd</button>
            <button onClick={() => setPaymentMethod("card")} className={cn("flex-1 py-1.5 text-xs font-medium rounded-lg transition-all", paymentMethod === "card" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>Kart</button>
            <button onClick={() => { setPaymentMethod("credit"); onOpenSupplierModal(); }} className={cn("flex-1 py-1.5 text-xs font-medium rounded-lg transition-all", paymentMethod === "credit" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>Nisyə</button>
          </div>

          {paymentMethod !== "credit" && cashboxes && cashboxes.length > 0 && setSelectedCashbox && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 px-1">Ödənişin ediləcəyi kassa</label>
              <select
                value={selectedCashbox || ""}
                onChange={(e) => setSelectedCashbox(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">Kassa seçin</option>
                {cashboxes
                  .filter(c => 
                    paymentMethod === "cash" ? c.type === "cash" : 
                    paymentMethod === "card" ? c.type === "card" || c.type === "bank" : true
                  )
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.balance.toFixed(2)} ₼)</option>
                ))}
              </select>
            </div>
          )}

          {paymentMethod === "credit" && selectedSupplier && (
            <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <p className="text-xs font-medium text-zinc-900">{selectedSupplier.name}</p>
              </div>
              <button 
                onClick={onOpenSupplierModal}
                className="text-[10px] text-zinc-500 hover:text-zinc-900 underline"
              >
                Dəyiş
              </button>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-zinc-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Cəmi</span>
              <span className="font-medium text-zinc-900">₼{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <span>Endirim</span>
                <button
                  onClick={() => setDiscountType(discountType === 'fixed' ? 'percentage' : 'fixed')}
                  className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 hover:bg-zinc-200 transition-colors"
                >
                  {discountType === 'fixed' ? '₼' : '%'}
                </button>
              </div>
              <input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="0.00"
                className="w-16 text-right bg-transparent border-b border-zinc-200 focus:border-zinc-900 focus:outline-none text-zinc-900 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Vergi (%)</span>
              <input
                type="number"
                value={tax || ''}
                onChange={(e) => setTax(Number(e.target.value))}
                placeholder="0"
                className="w-16 text-right bg-transparent border-b border-zinc-200 focus:border-zinc-900 focus:outline-none text-zinc-900 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 mt-2">
            <button onClick={onSaveDraft} disabled={cart.length === 0} className="p-3 rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all disabled:opacity-50">
              <Save className="w-5 h-5" />
            </button>
            <button disabled={cart.length === 0 || isProcessing} onClick={onCompletePurchase} className="flex-1 bg-zinc-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-between group shadow-sm">
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Ödəniləcək</span>
                <span className="text-lg font-bold">₼{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </div>
            </button>
          </div>

          {recentPurchases.length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Son Əməliyyatlar</p>
                <History className="w-3 h-3 text-zinc-300" />
              </div>
              <div className="space-y-2">
                {recentPurchases.slice(0, 3).map((purchase) => (
                  <div key={purchase.id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">{purchase.createdAt?.toDate().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        purchase.paymentMethod === 'cash' ? "bg-emerald-400" : 
                        purchase.paymentMethod === 'card' ? "bg-blue-400" : "bg-orange-400"
                      )} />
                    </div>
                    <span className="text-zinc-900 font-medium">₼{purchase.totalAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
