import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp, query, where, orderBy, limit, deleteDoc, onSnapshot } from "firebase/firestore";
import { 
  ShoppingCart, 
  Search, 
  Loader2, 
  CheckCircle, 
  Plus, 
  Trash2, 
  ChevronRight,
  Package,
  Users,
  X,
  History,
  Printer,
  Receipt,
  Save,
  Barcode,
  FileText,
  MessageCircle
} from "lucide-react";
import { ProductGrid } from "./sales/ProductGrid";
import { Cart } from "./sales/Cart";
import { motion, AnimatePresence } from "motion/react";
import { canRecordSales, canManageStores } from "../lib/permissions";
import { cn } from "../lib/utils";
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
  description?: string;
  status?: "active" | "passive";
}

interface CartItem extends Product {
  quantity: number;
}

export function Sales({ user }: { user: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Hamısı");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit">("cash");
  const [channel, setChannel] = useState<"online" | "offline">("offline");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartSearchQuery, setCartSearchQuery] = useState("");
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [tax, setTax] = useState(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<any>(null);
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
    let clientsQuery = query(collection(db, "contacts"), where("type", "==", "client"));
    let salesQuery = query(collection(db, "sales"), orderBy("createdAt", "desc"), limit(5));
    let draftsQuery = query(collection(db, "sale_drafts"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));

    if (!canRecordSales(user)) {
      const storeId = user.storeId || "default";
      productsQuery = query(collection(db, "products"), where("storeId", "==", storeId));
      clientsQuery = query(collection(db, "contacts"), where("type", "==", "client"), where("storeId", "==", storeId));
      salesQuery = query(collection(db, "sales"), where("marketId", "==", storeId), orderBy("createdAt", "desc"), limit(5));
      draftsQuery = query(collection(db, "sale_drafts"), where("userId", "==", user.uid), where("storeId", "==", storeId), orderBy("createdAt", "desc"));
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

    const unsubClients = onSnapshot(clientsQuery as any, (snap: any) => {
      setClients(snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as object) })));
    }, (error: any) => {
      if (error?.message?.includes("Quota") || error?.code === "resource-exhausted") {
        console.warn("Clients snapshot quota exceeded");
      } else {
        console.error("Clients snapshot error:", error);
      }
    });

    const unsubSales = onSnapshot(salesQuery as any, (snap: any) => {
      setRecentSales(snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as object) })));
    }, (error: any) => {
      if (error?.message?.includes("Quota") || error?.code === "resource-exhausted") {
        console.warn("Sales snapshot quota exceeded");
      } else {
        console.error("Sales snapshot error:", error);
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
      unsubClients();
      unsubSales();
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
        if (existing.quantity >= product.stock) {
          toast.error("Anbarda kifayət qədər məhsul yoxdur");
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
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
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
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
      await addDoc(collection(db, "sale_drafts"), {
        items: cart,
        discount,
        discountType,
        tax,
        selectedClient: selectedClient ? { id: selectedClient.id, name: selectedClient.name } : null,
        paymentMethod,
        channel,
        createdAt: serverTimestamp(),
        userId: user.uid,
        storeId: user.storeId || "default"
      });
      setCart([]);
      setDiscount(0);
      setDiscountType("fixed");
      setTax(0);
      setSelectedClient(null);
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
    if (draft.selectedClient) {
      const client = clients.find(c => c.id === draft.selectedClient.id);
      setSelectedClient(client || null);
    }
    setPaymentMethod(draft.paymentMethod || "cash");
    setChannel(draft.channel || "offline");
    setIsDraftsModalOpen(false);
    toast.success("Qaralama yükləndi");
  };

  const deleteDraft = async (id: string) => {
    try {
      await deleteDoc(doc(db, "sale_drafts", id));
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
        const product = products.find(p => p.id === productId);
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (productId: string, newPrice: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const filteredCart = useMemo(() => {
    return cart.filter(item => 
      item.name.toLowerCase().includes(cartSearchQuery.toLowerCase())
    );
  }, [cart, cartSearchQuery]);

  const handleCompleteSale = async () => {
    if (cart.length === 0 || isProcessing) return;
    if (paymentMethod === "credit" && !selectedClient) {
      toast.error("Nisyə satış üçün müştəri seçilməlidir.");
      return;
    }
    if (paymentMethod !== "credit" && !selectedCashbox) {
      toast.error("Zəhmət olmasa kassa seçin.");
      return;
    }
    
    setIsProcessing(true);
    try {
      // 1. Record the sale
      const saleData = {
        sellerId: user.uid,
        marketId: user.storeId || "default",
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
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
        channel,
        clientId: selectedClient?.id || null,
        clientName: selectedClient?.name || null,
        createdAt: serverTimestamp(),
      };
      
      const saleRef = await addDoc(collection(db, "sales"), saleData);
      setLastCompletedSale({ ...saleData, id: saleRef.id, createdAt: new Date() });

      // 2. Add cashbox transaction if paid
      if (paymentMethod !== "credit" && selectedCashbox) {
        await addCashboxTransaction(
          selectedCashbox,
          user.storeId || "default",
          "income",
          totalAmount,
          `Satış #${saleRef.id.slice(-6).toUpperCase()}${selectedClient ? ` (${selectedClient.name})` : ""}`,
          user.displayName || user.email,
          saleRef.id,
          "sale"
        );
      }

      // 3. Update stock for each product
      const updatePromises = cart.map(item => 
        updateDoc(doc(db, "products", item.id), {
          stock: increment(-item.quantity)
        })
      );
      
      // 3. Update client debt if it's a credit sale
      if (paymentMethod === "credit" && selectedClient) {
        updatePromises.push(
          updateDoc(doc(db, "contacts", selectedClient.id), {
            debt: increment(totalAmount)
          })
        );
      }

      await Promise.all(updatePromises);

      // 4. Success state
      setCart([]);
      setDiscount(0);
      setDiscountType("fixed");
      setTax(0);
      setSelectedClient(null);
      setPaymentMethod("cash");
      setChannel("offline");
      setOrderSuccess(true);
      setIsReceiptModalOpen(true);
      
      // Refresh local products list to reflect new stock
      setProducts(prev => prev.map(p => {
        const soldItem = cart.find(item => item.id === p.id);
        if (soldItem) return { ...p, stock: p.stock - soldItem.quantity };
        return p;
      }));

      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (error) {
      console.error("Satış tamamlanarkən xəta:", error);
      toast.error("Satış zamanı xəta baş verdi.");
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
    if (!lastCompletedSale) return;
    
    let message = `*Satış Qəbzi*\nID: #${lastCompletedSale.id.slice(-6).toUpperCase()}\n\n`;
    
    lastCompletedSale.items.forEach((item: any) => {
      message += `${item.quantity}x ${item.name} - ₼${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\nCəmi: ₼${lastCompletedSale.subtotal.toFixed(2)}\n`;
    
    if (lastCompletedSale.discount > 0) {
      const discountAmount = lastCompletedSale.discountType === 'percentage' 
        ? lastCompletedSale.subtotal * (lastCompletedSale.discount / 100) 
        : lastCompletedSale.discount;
      message += `Endirim: -₼${discountAmount.toFixed(2)}\n`;
    }
    
    if (lastCompletedSale.tax > 0) {
      const taxAmount = (lastCompletedSale.subtotal - (lastCompletedSale.discountType === 'percentage' ? lastCompletedSale.subtotal * (lastCompletedSale.discount / 100) : lastCompletedSale.discount)) * (lastCompletedSale.tax / 100);
      message += `Vergi: ₼${taxAmount.toFixed(2)}\n`;
    }
    
    message += `*Yekun: ₼${lastCompletedSale.totalAmount.toFixed(2)}*\n`;
    
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
        updatePrice={updatePrice}
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
        channel={channel}
        setChannel={setChannel}
        isProcessing={isProcessing}
        onSaveDraft={handleSaveDraft}
        onCompleteSale={handleCompleteSale}
        selectedClient={selectedClient}
        onOpenClientModal={() => setIsClientModalOpen(true)}
        recentSales={recentSales}
        cashboxes={cashboxes}
        selectedCashbox={selectedCashbox}
        setSelectedCashbox={setSelectedCashbox}
      />

      {/* Bottom Side: Product Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-[500px]">
        <header className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Satış Paneli</h2>
              <p className="text-zinc-500 mt-1">Sürətli satış və stok idarəetməsi.</p>
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
                  Satış uğurla tamamlandı!
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
      {/* Client Selection Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60] overflow-y-auto">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl mt-auto sm:my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-xl font-bold text-white">Müştəri Seçin</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client);
                    setIsClientModalOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left",
                    selectedClient?.id === client.id 
                    ? "bg-white text-zinc-900" 
                    : "bg-white/5 text-white hover:bg-white/10"
                  )}
                >
                  <div>
                    <p className="font-bold">{client.name}</p>
                    <p className="text-xs opacity-60">{client.phone || "Telefon yoxdur"}</p>
                  </div>
                  {client.debt > 0 && (
                    <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded-lg">
                      Borc: ₼{client.debt}
                    </span>
                  )}
                </button>
              ))}
              {clients.length === 0 && (
                <p className="text-center text-zinc-500 py-8">Müştəri tapılmadı.</p>
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
                      {draft.selectedClient && (
                        <p className="text-xs text-emerald-400 mt-1">Müştəri: {draft.selectedClient.name}</p>
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
        {isReceiptModalOpen && lastCompletedSale && (
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
                <h3 className="text-xl font-bold text-zinc-900">Satış Qəbzi</h3>
                <p className="text-xs text-zinc-500 mt-1">ID: #{lastCompletedSale.id.slice(-6).toUpperCase()}</p>
              </div>

              <div className="space-y-4 border-y border-zinc-100 py-6 my-6">
                <div className="space-y-2">
                  {lastCompletedSale.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-zinc-600">{item.quantity}x {item.name}</span>
                      <span className="font-bold text-zinc-900">₼{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Cəmi:</span>
                    <span className="text-zinc-600 font-medium">₼{lastCompletedSale.subtotal.toFixed(2)}</span>
                  </div>
                  {lastCompletedSale.discount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Endirim ({lastCompletedSale.discountType === 'percentage' ? `${lastCompletedSale.discount}%` : '₼'}):</span>
                      <span className="text-red-500 font-medium">-₼{
                        (lastCompletedSale.discountType === 'percentage' 
                          ? lastCompletedSale.subtotal * (lastCompletedSale.discount / 100) 
                          : lastCompletedSale.discount).toFixed(2)
                      }</span>
                    </div>
                  )}
                  {lastCompletedSale.tax > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Vergi ({lastCompletedSale.tax}%):</span>
                      <span className="text-zinc-600 font-medium">₼{( 
                        (lastCompletedSale.subtotal - (lastCompletedSale.discountType === 'percentage' ? lastCompletedSale.subtotal * (lastCompletedSale.discount / 100) : lastCompletedSale.discount)) 
                        * (lastCompletedSale.tax / 100) 
                      ).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black pt-2 border-t border-zinc-50 mt-2">
                    <span className="text-zinc-900 uppercase">Yekun:</span>
                    <span className="text-zinc-900">₼{lastCompletedSale.totalAmount.toFixed(2)}</span>
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
