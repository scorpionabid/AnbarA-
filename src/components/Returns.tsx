import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, addDoc, doc, where, orderBy, Timestamp, writeBatch, getDoc, limit } from "firebase/firestore";
import { Plus, Search, Loader2 } from "lucide-react";
import { canManageStores } from "../lib/permissions";
import { toast } from "sonner";
import { ReturnsTable } from "./returns/ReturnsTable";
import { AddReturnModal } from "./returns/AddReturnModal";

export function Returns({ user }: { user: any }) {
  const [returns, setReturns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [newReturn, setNewReturn] = useState({
    type: "customer_return",
    originalTransactionId: "",
    reason: "",
    totalRefund: 0,
  });

  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, [user.storeId, user.role]);

  const fetchData = async () => {
    if (!canManageStores(user) && !user.storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let returnsQ = query(collection(db, "returns"), orderBy("date", "desc"), limit(300));
      let productsQ = collection(db, "products") as any;

      if (!canManageStores(user)) {
        const storeId = user.storeId || "default";
        returnsQ = query(collection(db, "returns"), where("storeId", "==", storeId), orderBy("date", "desc"), limit(300));
        productsQ = query(collection(db, "products"), where("storeId", "==", storeId));
      }

      const [returnsSnap, productsSnap] = await Promise.all([
        getDocs(returnsQ),
        getDocs(productsQ)
      ]);

      setReturns(returnsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as any);
      setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as any);
    } catch (error) {
      console.error("Qaytarılmalar yüklənərkən xəta:", error);
      toast.error("Məlumatlar yüklənərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (product: any) => {
    const existing = returnItems.find(i => i.id === product.id);
    if (existing) {
      setReturnItems(returnItems.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setReturnItems([...returnItems, { 
        id: product.id, 
        name: product.name, 
        price: newReturn.type === "customer_return" ? product.price : (product.purchasePrice || 0), 
        quantity: 1 
      }]);
    }
    setProductSearch("");
  };

  const updateItemQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setReturnItems(returnItems.filter(i => i.id !== id));
    } else {
      setReturnItems(returnItems.map(i => i.id === id ? { ...i, quantity: qty } : i));
    }
  };

  const calculateTotal = () => {
    return returnItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (returnItems.length === 0) {
      toast.error("Ən azı bir məhsul seçilməlidir");
      return;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const storeId = user.storeId || "demo-store";
      const totalRefund = calculateTotal();

      // 1. Create Return Document
      const returnRef = doc(collection(db, "returns"));
      batch.set(returnRef, {
        storeId,
        type: newReturn.type,
        originalTransactionId: newReturn.originalTransactionId || null,
        items: returnItems,
        totalRefund,
        reason: newReturn.reason,
        recordedBy: user.displayName || user.email,
        date: Timestamp.now(),
      });

      // 2. Adjust Stock
      for (const item of returnItems) {
        const productRef = doc(db, "products", item.id);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock || 0;
          // If customer returns to us, stock goes UP.
          // If we return to supplier, stock goes DOWN.
          const stockChange = newReturn.type === "customer_return" ? item.quantity : -item.quantity;
          const newStock = currentStock + stockChange;
          
          batch.update(productRef, { stock: newStock });

          // 3. Log Inventory Change
          const logRef = doc(collection(db, "inventory_logs"));
          batch.set(logRef, {
            productId: item.id,
            productName: item.name,
            type: "update",
            change: stockChange,
            oldStock: currentStock,
            newStock: newStock,
            userEmail: user.email,
            storeId,
            year: new Date().getFullYear(),
            timestamp: Timestamp.now()
          });
        }
      }

      await batch.commit();
      toast.success("Qaytarılma uğurla qeydə alındı və anbar yeniləndi");
      setIsModalOpen(false);
      setReturnItems([]);
      setNewReturn({ type: "customer_return", originalTransactionId: "", reason: "", totalRefund: 0 });
      fetchData();
    } catch (error) {
      console.error("Qaytarılma xətası:", error);
      toast.error("Əməliyyat zamanı xəta baş verdi");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      const matchesSearch =
        (r.reason || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.originalTransactionId || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [returns, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode?.includes(productSearch)).slice(0, 5);
  }, [products, productSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Qaytarılmalar</h2>
          <p className="text-zinc-500 mt-1">Müştəri və təchizatçı qaytarmalarının idarə edilməsi</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Qaytarılma
        </button>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Səbəb və ya sənəd nömrəsi ilə axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      <ReturnsTable returns={filteredReturns} />

      <AddReturnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        newReturn={newReturn}
        setNewReturn={setNewReturn}
        handleSubmitReturn={handleSubmitReturn}
        isProcessing={isProcessing}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        filteredProducts={filteredProducts}
        handleAddItem={handleAddItem}
        returnItems={returnItems}
        updateItemQuantity={updateItemQuantity}
        calculateTotal={calculateTotal}
      />
    </div>
  );
}
