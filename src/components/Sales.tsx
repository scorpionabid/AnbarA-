import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp, query, where, orderBy, limit } from "firebase/firestore";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
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
  History
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice: number;
  stock: number;
  category: string;
  imageUrl?: string;
  description?: string;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsSnap, clientsSnap, salesSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(query(collection(db, "contacts"), where("type", "==", "client"))),
          getDocs(query(collection(db, "sales"), orderBy("createdAt", "desc"), limit(5)))
        ]);
        
        setProducts(productsSnap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as Product)));
        setClients(clientsSnap.docs.map(d => ({ id: d.id, ...(d.data() as object) })));
        setRecentSales(salesSnap.docs.map(d => ({ id: d.id, ...(d.data() as object) })));
      } catch (error) {
        console.error("Məlumatlar yüklənərkən xəta:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = useMemo(() => {
    const cats = ["Hamısı", ...new Set(products.map(p => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "Hamısı" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
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

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const filteredCart = useMemo(() => {
    return cart.filter(item => 
      item.name.toLowerCase().includes(cartSearchQuery.toLowerCase())
    );
  }, [cart, cartSearchQuery]);

  const handleCompleteSale = async () => {
    if (cart.length === 0 || isProcessing) return;
    if (paymentMethod === "credit" && !selectedClient) {
      alert("Nisyə satış üçün müştəri seçilməlidir.");
      return;
    }
    
    setIsProcessing(true);
    try {
      // 1. Record the sale
      const saleData = {
        sellerId: user.uid,
        marketId: user.marketId || "default",
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          purchasePrice: item.purchasePrice || 0,
          quantity: item.quantity
        })),
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "credit" ? "unpaid" : "paid",
        channel,
        clientId: selectedClient?.id || null,
        clientName: selectedClient?.name || null,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, "sales"), saleData);

      // Refresh recent sales
      const salesSnap = await getDocs(query(collection(db, "sales"), orderBy("createdAt", "desc"), limit(5)));
      setRecentSales(salesSnap.docs.map(d => ({ id: d.id, ...(d.data() as object) })));

      // 2. Update stock for each product
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
      setSelectedClient(null);
      setPaymentMethod("cash");
      setChannel("offline");
      setOrderSuccess(true);
      
      // Refresh local products list to reflect new stock
      setProducts(prev => prev.map(p => {
        const soldItem = cart.find(item => item.id === p.id);
        if (soldItem) return { ...p, stock: p.stock - soldItem.quantity };
        return p;
      }));

      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (error) {
      console.error("Satış tamamlanarkən xəta:", error);
      alert("Satış zamanı xəta baş verdi.");
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

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-12rem)]">
      {/* Left Side: Product Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <header className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Satış Paneli</h2>
              <p className="text-zinc-500 mt-1">Sürətli satış və stok idarəetməsi.</p>
            </div>
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

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Məhsul, barkod və ya kateqoriya axtar..."
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
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <motion.button
                layout
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className={`group relative flex flex-col bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all text-left ${p.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-95'}`}
              >
                <div className="aspect-square bg-zinc-100 relative overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <ShoppingBag className="w-10 h-10" />
                    </div>
                  )}
                  {p.stock <= 5 && p.stock > 0 && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                      Az qalıb: {p.stock}
                    </div>
                  )}
                  {p.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-sm">
                      Bitib
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm line-clamp-1">{p.name}</h4>
                    <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">{p.category}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-zinc-900">₼{p.price}</span>
                    <div className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Cart / Checkout */}
      <div className="w-full lg:w-[400px] flex flex-col bg-zinc-900 rounded-[2.5rem] text-white p-8 shadow-2xl relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <div className="relative flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-xl">Səbət</h3>
            </div>
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-zinc-400">
              {cart.reduce((acc, item) => acc + item.quantity, 0)} ədəd
            </span>
          </div>

          {cart.length > 0 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
              <input
                value={cartSearchQuery}
                onChange={(e) => setCartSearchQuery(e.target.value)}
                placeholder="Səbətdə axtar..."
                className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-8">
            <AnimatePresence mode="popLayout">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4 py-12">
                  <Package className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">Səbət boşdur</p>
                </div>
              ) : filteredCart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4 py-12">
                  <Search className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">Nəticə tapılmadı</p>
                </div>
              ) : (
                filteredCart.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={item.id}
                    className="group bg-white/5 border border-white/5 p-4 rounded-3xl hover:bg-white/10 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-zinc-500 text-xs">₼{item.price} / ədəd</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center bg-black/20 rounded-xl p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-black text-lg">₼{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setChannel("offline")}
                className={`py-2 rounded-xl font-bold text-xs transition-all ${
                  channel === "offline" 
                  ? "bg-white text-zinc-900 shadow-lg" 
                  : "bg-white/5 text-zinc-500 hover:bg-white/10"
                }`}
              >
                🏪 Mağaza
              </button>
              <button
                onClick={() => setChannel("online")}
                className={`py-2 rounded-xl font-bold text-xs transition-all ${
                  channel === "online" 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "bg-white/5 text-zinc-500 hover:bg-white/10"
                }`}
              >
                🌐 Onlayn
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl font-bold text-xs transition-all ${
                  paymentMethod === "cash" 
                  ? "bg-white text-zinc-900 shadow-xl" 
                  : "bg-white/5 text-zinc-500 hover:bg-white/10"
                }`}
              >
                <Banknote className="w-4 h-4" />
                Nağd
              </button>
              <button
                onClick={() => setPaymentMethod("card")}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl font-bold text-xs transition-all ${
                  paymentMethod === "card" 
                  ? "bg-white text-zinc-900 shadow-xl" 
                  : "bg-white/5 text-zinc-500 hover:bg-white/10"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Kart
              </button>
              <button
                onClick={() => {
                  setPaymentMethod("credit");
                  setIsClientModalOpen(true);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl font-bold text-xs transition-all ${
                  paymentMethod === "credit" 
                  ? "bg-white text-zinc-900 shadow-xl" 
                  : "bg-white/5 text-zinc-500 hover:bg-white/10"
                }`}
              >
                <Users className="w-4 h-4" />
                Nisyə
              </button>
            </div>

            {paymentMethod === "credit" && selectedClient && (
              <div className="bg-white/10 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Müştəri</p>
                  <p className="text-sm font-bold">{selectedClient.name}</p>
                </div>
                <button 
                  onClick={() => setIsClientModalOpen(true)}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Dəyiş
                </button>
              </div>
            )}

            <div className="bg-white/5 p-6 rounded-[2rem] space-y-2">
              <div className="flex justify-between items-center text-zinc-500 text-sm">
                <span>Cəmi məbləğ</span>
                <span>₼{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Ödəniləcək:</span>
                <span className="text-3xl font-black">₼{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCompleteSale}
              className="group w-full bg-white text-zinc-900 py-5 rounded-[2rem] font-black text-lg hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-3"
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Satışı Tamamla
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Recent Sales Section */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Son Satışlar</h4>
                <History className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {sale.createdAt?.toDate().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs font-bold truncate max-w-[120px]">
                        {sale.items.length} məhsul
                      </span>
                      {sale.channel === 'online' && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded mt-1 w-fit font-bold">
                          🌐 Onlayn
                        </span>
                      )}
                      {sale.channel === 'offline' && (
                        <span className="text-[10px] bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded mt-1 w-fit font-bold">
                          🏪 Mağaza
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black">₼{sale.totalAmount.toFixed(2)}</span>
                      <div className="flex items-center gap-1 justify-end">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          sale.paymentMethod === 'cash' ? "bg-emerald-500" : 
                          sale.paymentMethod === 'card' ? "bg-blue-500" : "bg-orange-500"
                        )} />
                        <span className="text-[8px] text-zinc-500 uppercase font-bold">
                          {sale.paymentMethod === 'cash' ? 'Nağd' : 
                           sale.paymentMethod === 'card' ? 'Kart' : 'Nisyə'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentSales.length === 0 && (
                  <p className="text-center text-zinc-600 text-[10px] py-4 italic">Hələ satış yoxdur</p>
                )}
              </div>
            </div>
          </div>
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
    </div>
  );
}
