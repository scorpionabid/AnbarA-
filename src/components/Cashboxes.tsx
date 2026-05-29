import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, addDoc, doc, where, orderBy, Timestamp, writeBatch, deleteDoc, getDoc, limit } from "firebase/firestore";
import { Plus, Search, Loader2, ArrowRightLeft } from "lucide-react";
import { canManageStores, canManageStoreData } from "../lib/permissions";
import { toast } from "sonner";
import { CashboxCards } from "./cashboxes/CashboxCards";
import { TransactionTable } from "./cashboxes/TransactionTable";
import { AddCashboxModal } from "./cashboxes/AddCashboxModal";
import { AddTransactionModal } from "./cashboxes/AddTransactionModal";

export function Cashboxes({ user }: { user: any }) {
  const [cashboxes, setCashboxes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isCashboxModalOpen, setIsCashboxModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [newCashbox, setNewCashbox] = useState({
    name: "",
    type: "cash",
    balance: "",
  });

  const [newTransaction, setNewTransaction] = useState({
    cashboxId: "",
    type: "income",
    amount: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, [user.storeId, user.role]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!canManageStores(user) && !user.storeId) {
        setLoading(false);
        return;
      }

      let cashboxesQ = collection(db, "cashboxes") as any;
      let transactionsQ = query(collection(db, "cashbox_transactions"), orderBy("date", "desc"), limit(500));

      if (!canManageStores(user)) {
        const storeId = user.storeId || "default";
        cashboxesQ = query(collection(db, "cashboxes"), where("storeId", "==", storeId));
        transactionsQ = query(collection(db, "cashbox_transactions"), where("storeId", "==", storeId), orderBy("date", "desc"), limit(500));
      }

      const [cashboxesSnap, transactionsSnap] = await Promise.all([
        getDocs(cashboxesQ),
        getDocs(transactionsQ)
      ]);

      const loadedCashboxes = cashboxesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
      setCashboxes(loadedCashboxes as any);
      setTransactions(transactionsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as any);

      if (loadedCashboxes.length > 0 && !newTransaction.cashboxId) {
        setNewTransaction(prev => ({ ...prev, cashboxId: loadedCashboxes[0].id }));
      }
    } catch (error) {
      console.error("Kassalar yüklənərkən xəta:", error);
      toast.error("Məlumatlar yüklənərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCashbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCashbox.name || isNaN(Number(newCashbox.balance))) {
      toast.error("Düzgün məlumat daxil edin");
      return;
    }

    setIsProcessing(true);
    try {
      const cashboxData = {
        storeId: user.storeId || "demo-store",
        name: newCashbox.name,
        type: newCashbox.type,
        balance: Number(newCashbox.balance),
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "cashboxes"), cashboxData);
      toast.success("Kassa əlavə edildi");
      setIsCashboxModalOpen(false);
      setNewCashbox({ name: "", type: "cash", balance: "" });
      fetchData();
    } catch (error) {
      console.error("Kassa əlavə edilərkən xəta:", error);
      toast.error("Xəta baş verdi");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCashbox = async (id: string) => {
    if (!window.confirm("Bu kassanı silmək istədiyinizə əminsiniz?")) return;
    try {
      await deleteDoc(doc(db, "cashboxes", id));
      toast.success("Kassa silindi");
      setCashboxes(cashboxes.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Kassa silinərkən xəta:", error);
      toast.error("Sizin bu əməliyyatı etmək üçün hüququnuz yoxdur");
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.cashboxId || !newTransaction.amount || isNaN(Number(newTransaction.amount))) {
      toast.error("Düzgün məlumat daxil edin");
      return;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const storeId = user.storeId || "demo-store";
      const amount = Number(newTransaction.amount);

      // 1. Create Transaction Record
      const txRef = doc(collection(db, "cashbox_transactions"));
      batch.set(txRef, {
        cashboxId: newTransaction.cashboxId,
        storeId,
        type: newTransaction.type,
        amount,
        description: newTransaction.description,
        recordedBy: user.displayName || user.email,
        date: Timestamp.now(),
      });

      // 2. Update Cashbox Balance
      const cashboxRef = doc(db, "cashboxes", newTransaction.cashboxId);
      const cashboxDoc = await getDoc(cashboxRef);
      
      if (cashboxDoc.exists()) {
        const currentBalance = cashboxDoc.data().balance || 0;
        const newBalance = newTransaction.type === "income" ? currentBalance + amount : currentBalance - amount;
        batch.update(cashboxRef, { balance: newBalance });
      }

      await batch.commit();
      toast.success("Əməliyyat uğurla qeydə alındı");
      setIsTransactionModalOpen(false);
      setNewTransaction({ ...newTransaction, amount: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Əməliyyat xətası:", error);
      toast.error("Əməliyyat zamanı xəta baş verdi");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [transactions, searchQuery]);

  const totalBalance = useMemo(() => {
    return cashboxes.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  }, [cashboxes]);

  const getCashboxName = (id: string) => {
    return cashboxes.find(c => c.id === id)?.name || "Bilinməyən Kassa";
  };

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
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Kassalar və Hesablar</h2>
          <p className="text-zinc-500 mt-1">Nağd, kart və bank hesablarının idarə edilməsi</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsTransactionModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            <ArrowRightLeft className="w-5 h-5" />
            Mədaxil / Məxaric
          </button>
          {canManageStoreData(user, user.storeId) && (
            <button
              onClick={() => setIsCashboxModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Yeni Kassa
            </button>
          )}
        </div>
      </header>

      <CashboxCards 
        cashboxes={cashboxes} 
        totalBalance={totalBalance} 
        user={user} 
        handleDeleteCashbox={handleDeleteCashbox} 
      />

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Əməliyyat qeydi ilə axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      <TransactionTable 
        transactions={filteredTransactions} 
        getCashboxName={getCashboxName} 
      />

      <AddCashboxModal
        isOpen={isCashboxModalOpen}
        onClose={() => setIsCashboxModalOpen(false)}
        newCashbox={newCashbox}
        setNewCashbox={setNewCashbox}
        handleAddCashbox={handleAddCashbox}
        isProcessing={isProcessing}
      />

      <AddTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        handleAddTransaction={handleAddTransaction}
        isProcessing={isProcessing}
        cashboxes={cashboxes}
      />
    </div>
  );
}
