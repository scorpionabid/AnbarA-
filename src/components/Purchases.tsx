import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp, query, where, orderBy, limit, deleteDoc, onSnapshot } from "firebase/firestore";
import { 
  ShoppingCart, 
  Search, 
  Loader2, 
  CheckCircle, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote,
  ChevronRight,
  Package,
  Users,
  X,
  History,
  ArrowDownToLine,
  Printer,
  Receipt,
  Save,
  Barcode,
  FileText,
  MessageCircle
} from "lucide-react";
import { ProductGrid } from "./purchases/ProductGrid";
import { Cart } from "./purchases/Cart";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { canManageStores } from "../lib/permissions";
import { toast } from "sonner";
import { useCashboxes } from "../hooks/useCashboxes";
import { addCashboxTransaction } from "../lib/financeUtils";

interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice: number;
  stock: number;
  category: string;
  imageUrl?: string;
  status?: "active" | "passive";
}

interface CartItem extends Product {
  quantity: number;
}

export function Purchases({ user }: { user: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Hamısı");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit">("cash");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartSearchQuery, setCartSearchQuery] = useState("");
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [tax, setTax] = useState(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastCompletedPurchase, setLastCompletedPurchase] = useState<any>(null);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const { cashboxes } = useCashboxes(user);
  const [selectedCashbox, setSelectedCashbox] = useState<string>("");

  useEffect(() => {
    if (paymentMethod !== "credit" && cashboxes.length > 0) {
      const defaultCashbox = cashboxes.find(c => 
        paymentMethod === "cash" ? c.type === "cash" : 
        paymentMethod === "card" ? c.type === "card" || c.type === "bank" : true
      );
      if (defaultCashbox && !selectedCashbox) {
        setSelectedCashbox(defaultCashbox.id);
      }
    }
  }, [paymentMethod, cashboxes, selectedCashbox]);

  useEffect(() => {
    if (!canManageStores(user) && !user.storeId) {
      setLoading(false);
      return;
    }

    let productsQuery = collection(db, "products") as any;
    let suppliersQuery = query(collection(db, "contacts"), where("type", "==", "supplier"));
    let purchasesQuery = query(collection(db, "purchases"), orderBy("createdAt", "desc"), limit(5));
    let draftsQuery = query(collection(db, "purchase_drafts"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));

    if (!canManageStores(user)) {
      const storeId = user.storeId || "default";
      productsQuery = query(collection(db, "products"), where("storeId", "==", storeId));
      suppliersQuery = query(collection(db, "contacts"), where("type", "==", "supplier"), where("storeId", "==", storeId));
      purchasesQuery = query(collection(db, "purchases"), where("storeId", "==", storeId), orderBy("createdAt", "desc"), limit(5));
      draftsQuery = query(collection(db, "purchase_drafts"), where("userId", "==", user.uid), where("storeId", "==", storeId), orderBy("createdAt", "desc"));
    }

    const unsubProducts = onSnapshot(productsQuery as any, (snap: any) => {
      setProducts(snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as object) } as Product)).filter((p: Product) => p.status !== "passive"));
      setLoading(false);
    }, (error: any) => {
      if (error?.message?.includes("Quota") || error?.code === "resource-exhausted") {
        console.warn("Products snapshot quota exceeded");
      } else {
        console.error("Products snapshot error:", error);
        toast.error("Məhsullar yüklənərkən xəta baş verdi");
      }
      setLoading(false);
    });

    const unsubSuppliers = onSnapshot(suppliersQuery as any, (snap: any) => {
      setSuppliers(snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as object) })));
    }, (error: any) => {
      if (error?.message?.includes("Quota") || error?.code === "resource-exhausted") {
        console.warn("Suppliers snapshot quota exceeded");
      } else {
        console.error("Suppliers snapshot error:", error);
      }
    });

    const unsubPurchases = onSnapshot(purchasesQuery as any, (snap: any) => {
      setRecentPurchases(snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as object) })));
    }, (error: any) => {
      if (error?.message?.includes("Quota") || error?.code === "resource-exhausted") {
        console.warn("Purchases snapshot quota exceeded");
      } else {
        console.error("Purchases snapshot error:", error);
      }
    });

    const unsubDrafts = onSnapshot(draftsQuery as any, (snap: any) => {
      setDrafts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    }, (error: any) => {
      if (error?.message?.includes("Quota") || error?.code === "resource-exhausted") {
        console.warn("Drafts snapshot quota exceeded");
      } else {
        console.error("Drafts snapshot error:", error);
      }
    });

    return () => {
      unsubProducts();
      unsubSuppliers();
      unsubPurchases();
      unsubDrafts();
    };
  }, [user.uid, user.storeId, user.role]);

  const categories = useMemo(() => {
    const cats = ["Hamısı", ...new Set(products.map(p => (p as any).categoryName || p.category).filter(Boolean))];
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const cat = (p as any).categoryName || p.category;
      const matchesCategory = selectedCategory === "Hamısı" || cat === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, purchasePrice: product.purchasePrice || 0, quantity: 1 }];
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => 
      (p as any).barcode === barcodeInput || (p as any).sku === barcodeInput
    );
    if (product) {
      addToCart(product);
      setBarcodeInput("");
      toast.success(`${product.name} səbətə əlavə edildi`);
    } else {
      toast.error("Məhsul tapılmadı");
    }
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + ((item.purchasePrice || 0) * item.quantity), 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    const discountAmount = discountType === "percentage" ? subtotal * (discount / 100) : discount;
    const discounted = subtotal - discountAmount;
    const taxed = discounted * (1 + tax / 100);
    return Math.max(0, taxed);
  }, [subtotal, discount, discountType, tax]);

  const handleSaveDraft = async () => {
    if (cart.length === 0) return;
    try {
      await addDoc(collection(db, "purchase_drafts"), {
        items: cart,
        discount,
        discountType,
        tax,
        selectedSupplier: selectedSupplier ? { id: selectedSupplier.id, name: selectedSupplier.name } : null,
        paymentMethod,
        createdAt: serverTimestamp(),
        userId: user.uid,
        storeId: user.storeId || "default"
      });
      setCart([]);
      setDiscount(0);
      setDiscountType("fixed");
      setTax(0);
      setSelectedSupplier(null);
      toast.success("Qaralama yadda saxlanıldı");
    } catch (error) {
      toast.error("Xəta baş verdi");
    }
  };

  const loadDraft = (draft: any) => {
    setCart(draft.items);
    setDiscount(draft.discount || 0);
    setDiscountType(draft.discountType || "fixed");
    setTax(draft.tax || 0);
    if (draft.selectedSupplier) {
      const supplier = suppliers.find(s => s.id === draft.selectedSupplier.id);
      setSelectedSupplier(supplier || null);
    }
    setPaymentMethod(draft.paymentMethod || "cash");
    setIsDraftsModalOpen(false);
    toast.success("Qaralama yükləndi");
  };

  const deleteDraft = async (id: string) => {
    try {
      await deleteDoc(doc(db, "purchase_drafts", id));
      toast.success("Qaralama silindi");
    } catch (error) {
      toast.error("Xəta baş verdi");
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updatePurchasePrice = (productId: string, newPrice: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, purchasePrice: Math.max(0, newPrice) };
      }
      return item;
    }));
  };

  const filteredCart = useMemo(() => {
    return cart.filter(item => 
      item.name.toLowerCase().includes(cartSearchQuery.toLowerCase())
    );
  }, [cart, cartSearchQuery]);

  const handleCompletePurchase = async () => {
    if (cart.length === 0 || isProcessing) return;
    if (paymentMethod === "credit" && !selectedSupplier) {
      toast.error("Nisyə alış üçün tədarükçü seçilməlidir.");
      return;
    }
    if (paymentMethod !== "credit" && !selectedCashbox) {
      toast.error("Zəhmət olmasa kassa seçin.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const purchaseData = {
        buyerId: user.uid,
        storeId: user.storeId || "default",
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          purchasePrice: item.purchasePrice || 0,
          quantity: item.quantity
        })),
        subtotal,
        discount,
        discountType,
        tax,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "credit" ? "unpaid" : "paid",
        supplierId: selectedSupplier?.id || null,
        supplierName: selectedSupplier?.name || null,
        createdAt: serverTimestamp(),
      };
      
      const purchaseRef = await addDoc(collection(db, "purchases"), purchaseData);
      setLastCompletedPurchase({ ...purchaseData, id: purchaseRef.id, createdAt: new Date() });

      // Record Cashbox Transaction
      if (paymentMethod !== "credit" && selectedCashbox) {
        await addCashboxTransaction(
          selectedCashbox,
          user.storeId || "default",
          "expense", // purchases are an expense
          totalAmount,
          `Alış #${purchaseRef.id.slice(-6).toUpperCase()}${selectedSupplier ? ` (${selectedSupplier.name})` : ""}`,
          user.displayName || user.email,
          purchaseRef.id,
          "purchase"
        );
      }

      const updatePromises = cart.map(item => 
        updateDoc(doc(db, "products", item.id), {
          stock: increment(item.quantity)
        })
      );
      
      if (paymentMethod === "credit" && selectedSupplier) {
        updatePromises.push(
          updateDoc(doc(db, "contacts", selectedSupplier.id), {
            debt: increment(totalAmount)
          })
        );
      }

      await Promise.all(updatePromises);

      setCart([]);
      setDiscount(0);
      setDiscountType("fixed");
      setTax(0);
      setSelectedSupplier(null);
      setPaymentMethod("cash");
      setOrderSuccess(true);
      setIsReceiptModalOpen(true);
      
      setProducts(prev => prev.map(p => {
        const boughtItem = cart.find(item => item.id === p.id);
        if (boughtItem) return { ...p, stock: p.stock + boughtItem.quantity };
        return p;
      }));

      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (error) {
      console.error("Alış tamamlanarkən xəta:", error);
      toast.error("Alış zamanı xəta baş verdi.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-zinc-900" />
      <p className="text-zinc-500 font-medium">Məhsullar yüklənir...</p>
    </div>
  );

  const sendToWhatsApp = () => {
    if (!lastCompletedPurchase) return;
    
    let message = `*Alış Qəbzi*\nID: #${lastCompletedPurchase.id.slice(-6).toUpperCase()}\n\n`;
    
    lastCompletedPurchase.items.forEach((item: any) => {
      message += `${item.quantity}x ${item.name} - ₼${(item.purchasePrice * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\nCəmi: ₼${lastCompletedPurchase.subtotal.toFixed(2)}\n`;
    
    if (lastCompletedPurchase.discount > 0) {
      const discountAmount = lastCompletedPurchase.discountType === 'percentage' 
        ? lastCompletedPurchase.subtotal * (lastCompletedPurchase.discount / 100) 
        : lastCompletedPurchase.discount;
      message += `Endirim: -₼${discountAmount.toFixed(2)}\n`;
    }
    
    if (lastCompletedPurchase.tax > 0) {
      const taxAmount = (lastCompletedPurchase.subtotal - (lastCompletedPurchase.discountType === 'percentage' ? lastCompletedPurchase.subtotal * (lastCompletedPurchase.discount / 100) : lastCompletedPurchase.discount)) * (lastCompletedPurchase.tax / 100);
      message += `Vergi: ₼${taxAmount.toFixed(2)}\n`;
    }
    
    message += `*Yekun: ₼${lastCompletedPurchase.totalAmount.toFixed(2)}*\n`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-8 h-auto">
      <Cart
        cart={cart}
        filteredCart={filteredCart}
        cartSearchQuery={cartSearchQuery}
        setCartSearchQuery={setCartSearchQuery}
        updateQuantity={updateQuantity}
        updatePurchasePrice={updatePurchasePrice}
        removeFromCart={removeFromCart}
        subtotal={subtotal}
        totalAmount={totalAmount}
        discount={discount}
        setDiscount={setDiscount}
        discountType={discountType}
        setDiscountType={setDiscountType}
        tax={tax}
        setTax={setTax}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        isProcessing={isProcessing}
        onSaveDraft={handleSaveDraft}
        onCompletePurchase={handleCompletePurchase}
        selectedSupplier={selectedSupplier}
        onOpenSupplierModal={() => setIsSupplierModalOpen(true)}
        recentPurchases={recentPurchases}
        cashboxes={cashboxes}
        selectedCashbox={selectedCashbox}
        setSelectedCashbox={setSelectedCashbox}
      />

      <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-[500px]">
        <header className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Alış Paneli</h2>
              <p className="text-zinc-500 mt-1">Tədarükçülərdən məhsul alışı və stoka əlavə.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDraftsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all"
              >
                <Save className="w-4 h-4" />
                Qaralamalar
              </button>
              {orderSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border border-emerald-100"
                >
                  <CheckCircle className="w-4 h-4" />
                  Alış uğurla tamamlandı!
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Barkod və ya SKU skan edin..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-mono"
              />
            </form>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Məhsul və ya kateqoriya axtar..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                    ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
        </div>
      </div>
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60] overflow-y-auto">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl mt-auto sm:my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-xl font-bold text-white">Tədarükçü Seçin</h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {suppliers.map(supplier => (
                <button
                  key={supplier.id}
                  onClick={() => {
                    setSelectedSupplier(supplier);
                    setIsSupplierModalOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left",
                    selectedSupplier?.id === supplier.id 
                    ? "bg-white text-zinc-900" 
                    : "bg-white/5 text-white hover:bg-white/10"
                  )}
                >
                  <div>
                    <p className="font-bold">{supplier.name}</p>
                    <p className="text-xs opacity-60">{supplier.phone || "Telefon yoxdur"}</p>
                  </div>
                  {supplier.debt > 0 && (
                    <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded-lg">
                      Borc: ₼{supplier.debt}
                    </span>
                  )}
                </button>
              ))}
              {suppliers.length === 0 && (
                <p className="text-center text-zinc-500 py-8">Tədarükçü tapılmadı.</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Drafts Modal */}
      <AnimatePresence>
        {isDraftsModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 w-full max-w-2xl rounded-3xl p-8 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Save className="w-6 h-6 text-zinc-400" />
                  Qaralamalar
                </h3>
                <button onClick={() => setIsDraftsModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {drafts.map((draft) => (
                  <div key={draft.id} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center group">
                    <div>
                      <p className="text-white font-bold">{draft.items.length} məhsul</p>
                      <p className="text-xs text-zinc-500">
                        {draft.createdAt?.toDate().toLocaleString('az-AZ')}
                      </p>
                      {draft.selectedSupplier && (
                        <p className="text-xs text-emerald-400 mt-1">Tədarükçü: {draft.selectedSupplier.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadDraft(draft)}
                        className="px-4 py-2 bg-white text-zinc-900 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-all"
                      >
                        Yüklə
                      </button>
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {drafts.length === 0 && (
                  <div className="text-center py-12">
                    <Save className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500">Heç bir qaralama tapılmadı.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {isReceiptModalOpen && lastCompletedPurchase && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="receipt-modal bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-zinc-900" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Alış Qəbzi</h3>
                <p className="text-xs text-zinc-500 mt-1">ID: #{lastCompletedPurchase.id.slice(-6).toUpperCase()}</p>
              </div>

              <div className="space-y-4 border-y border-zinc-100 py-6 my-6">
                <div className="space-y-2">
                  {lastCompletedPurchase.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-zinc-600">{item.quantity}x {item.name}</span>
                      <span className="font-bold text-zinc-900">₼{(item.purchasePrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Cəmi:</span>
                    <span className="text-zinc-600 font-medium">₼{lastCompletedPurchase.subtotal.toFixed(2)}</span>
                  </div>
                  {lastCompletedPurchase.discount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Endirim ({lastCompletedPurchase.discountType === 'percentage' ? `${lastCompletedPurchase.discount}%` : '₼'}):</span>
                      <span className="text-red-500 font-medium">-₼{
                        (lastCompletedPurchase.discountType === 'percentage' 
                          ? lastCompletedPurchase.subtotal * (lastCompletedPurchase.discount / 100) 
                          : lastCompletedPurchase.discount).toFixed(2)
                      }</span>
                    </div>
                  )}
                  {lastCompletedPurchase.tax > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Vergi ({lastCompletedPurchase.tax}%):</span>
                      <span className="text-zinc-600 font-medium">₼{( 
                        (lastCompletedPurchase.subtotal - (lastCompletedPurchase.discountType === 'percentage' ? lastCompletedPurchase.subtotal * (lastCompletedPurchase.discount / 100) : lastCompletedPurchase.discount)) 
                        * (lastCompletedPurchase.tax / 100) 
                      ).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black pt-2 border-t border-zinc-50 mt-2">
                    <span className="text-zinc-900 uppercase">Yekun:</span>
                    <span className="text-zinc-900">₼{lastCompletedPurchase.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all"
                  >
                    <Printer className="w-5 h-5" />
                    Çap Et
                  </button>
                  <button
                    onClick={sendToWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </button>
                </div>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="w-full py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                >
                  Bağla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
