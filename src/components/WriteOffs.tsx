import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, doc, where, orderBy, Timestamp, writeBatch, getDoc, limit } from "firebase/firestore";
import { Plus, Search, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { WriteOffStats } from "./writeoffs/WriteOffStats";
import { WriteOffTable } from "./writeoffs/WriteOffTable";
import { AddWriteOffModal } from "./writeoffs/AddWriteOffModal";

export function WriteOffs({ user }: { user: any }) {
  const [writeOffs, setWriteOffs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [newWriteOff, setNewWriteOff] = useState({
    reason: "",
  });

  const [writeOffItems, setWriteOffItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, [user.storeId, user.role]);

  const fetchData = async () => {
    if (user.role !== "super_admin" && !user.storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let writeOffsQ = query(collection(db, "write_offs"), orderBy("date", "desc"), limit(300));
      let productsQ = collection(db, "products") as any;

      if (user.role !== "super_admin") {
        const storeId = user.storeId || "default";
        writeOffsQ = query(collection(db, "write_offs"), where("storeId", "==", storeId), orderBy("date", "desc"), limit(300));
        productsQ = query(collection(db, "products"), where("storeId", "==", storeId));
      }

      const [writeOffsSnap, productsSnap] = await Promise.all([
        getDocs(writeOffsQ),
        getDocs(productsQ)
      ]);

      setWriteOffs(writeOffsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as any);
      setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as any);
    } catch (error) {
      console.error("Silinmələr yüklənərkən xəta:", error);
      toast.error("Məlumatlar yüklənərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (product: any) => {
    const existing = writeOffItems.find(i => i.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error("Anbarda kifayət qədər məhsul yoxdur");
        return;
      }
      setWriteOffItems(writeOffItems.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      if (product.stock <= 0) {
        toast.error("Anbarda bu məhsuldan yoxdur");
        return;
      }
      setWriteOffItems([...writeOffItems, { 
        id: product.id, 
        name: product.name, 
        cost: product.purchasePrice || product.price || 0, // Prefer purchase price for loss calculation
        quantity: 1,
        maxStock: product.stock
      }]);
    }
    setProductSearch("");
  };

  const updateItemQuantity = (id: string, qty: number, maxStock: number) => {
    if (qty <= 0) {
      setWriteOffItems(writeOffItems.filter(i => i.id !== id));
    } else if (qty > maxStock) {
      toast.error(`Anbarda cəmi ${maxStock} ədəd var`);
      setWriteOffItems(writeOffItems.map(i => i.id === id ? { ...i, quantity: maxStock } : i));
    } else {
      setWriteOffItems(writeOffItems.map(i => i.id === id ? { ...i, quantity: qty } : i));
    }
  };

  const calculateTotalLoss = () => {
    return writeOffItems.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
  };

  const handleSubmitWriteOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (writeOffItems.length === 0) {
      toast.error("Ən azı bir məhsul seçilməlidir");
      return;
    }
    if (!newWriteOff.reason) {
      toast.error("Silinmə səbəbini qeyd edin");
      return;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const storeId = user.storeId || "demo-store";
      const totalLoss = calculateTotalLoss();

      // Clean items for DB (remove maxStock)
      const cleanItems = writeOffItems.map(({ maxStock, ...rest }) => rest);

      // 1. Create WriteOff Document
      const writeOffRef = doc(collection(db, "write_offs"));
      batch.set(writeOffRef, {
        storeId,
        items: cleanItems,
        totalLoss,
        reason: newWriteOff.reason,
        recordedBy: user.displayName || user.email,
        date: Timestamp.now(),
      });

      // 2. Adjust Stock
      for (const item of cleanItems) {
        const productRef = doc(db, "products", item.id);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          
          batch.update(productRef, { stock: newStock });

          // 3. Log Inventory Change
          const logRef = doc(collection(db, "inventory_logs"));
          batch.set(logRef, {
            productId: item.id,
            productName: item.name,
            type: "write_off",
            change: -item.quantity,
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
      toast.success("Məhsullar uğurla silindi və anbar yeniləndi");
      setIsModalOpen(false);
      setWriteOffItems([]);
      setNewWriteOff({ reason: "" });
      fetchData();
    } catch (error) {
      console.error("Silinmə xətası:", error);
      toast.error("Əməliyyat zamanı xəta baş verdi");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredWriteOffs = useMemo(() => {
    return writeOffs.filter((w) => {
      const matchesSearch = (w.reason || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [writeOffs, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode?.includes(productSearch)).slice(0, 5);
  }, [products, productSearch]);

  const totalLossAmount = useMemo(() => {
    return filteredWriteOffs.reduce((acc, curr) => acc + (curr.totalLoss || 0), 0);
  }, [filteredWriteOffs]);

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
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Silinmələr (Zay olanlar)</h2>
          <p className="text-zinc-500 mt-1">Xarab olmuş, vaxtı keçmiş və ya itmiş məhsulların silinməsi</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          Yeni Silinmə
        </button>
      </header>

      <WriteOffStats totalLossAmount={totalLossAmount} />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Səbəb ilə axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      <WriteOffTable writeOffs={filteredWriteOffs} />

      <AddWriteOffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        newWriteOff={newWriteOff}
        setNewWriteOff={setNewWriteOff}
        handleSubmitWriteOff={handleSubmitWriteOff}
        isProcessing={isProcessing}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        filteredProducts={filteredProducts}
        handleAddItem={handleAddItem}
        writeOffItems={writeOffItems}
        updateItemQuantity={updateItemQuantity}
        calculateTotalLoss={calculateTotalLoss}
      />
    </div>
  );
}
