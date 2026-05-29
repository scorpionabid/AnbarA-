import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, addDoc, deleteDoc, doc, where, orderBy, Timestamp, limit } from "firebase/firestore";
import { Plus, Search, Trash2, Loader2, Receipt, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { canManageStores, canManageStoreData } from "../lib/permissions";
import { useCashboxes } from "../hooks/useCashboxes";
import { addCashboxTransaction } from "../lib/financeUtils";

export function Expenses({ user }: { user: any }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { cashboxes } = useCashboxes(user);
  const [selectedCashbox, setSelectedCashbox] = useState<string>("");
  const [newExpense, setNewExpense] = useState({
    amount: "",
    category: "İcarə",
    note: "",
  });

  const expenseCategories = [
    "İcarə",
    "Kommunal",
    "Maaş",
    "Nəqliyyat",
    "Marketinq",
    "Təmir",
    "Digər",
  ];

  useEffect(() => {
    if (cashboxes.length > 0 && !selectedCashbox) {
      setSelectedCashbox(cashboxes[0].id);
    }
  }, [cashboxes, selectedCashbox]);

  useEffect(() => {
    fetchExpenses();
  }, [user.storeId, user.role]);

  const fetchExpenses = async () => {
    if (!canManageStores(user) && !user.storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let q = query(collection(db, "expenses"), orderBy("date", "desc"), limit(500));
      if (!canManageStores(user)) {
        const storeId = user.storeId || "default";
        q = query(collection(db, "expenses"), where("storeId", "==", storeId), orderBy("date", "desc"), limit(500));
      }
      const snap = await getDocs(q);
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Xərclər yüklənərkən xəta:", error);
      toast.error("Xərclər yüklənərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || isNaN(Number(newExpense.amount))) {
      toast.error("Düzgün məbləğ daxil edin");
      return;
    }
    
    if (!selectedCashbox) {
      toast.error("Ödənişin silinəcəyi kassanı seçin");
      return;
    }

    try {
      const expenseData = {
        storeId: user.storeId || "demo-store",
        amount: Number(newExpense.amount),
        category: newExpense.category,
        note: newExpense.note,
        recordedBy: user.displayName || user.email,
        date: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, "expenses"), expenseData);
      
      // Record Cashbox Transaction
      await addCashboxTransaction(
        selectedCashbox,
        user.storeId || "demo-store",
        "expense", // Expense out
        Number(newExpense.amount),
        `Xərc: ${newExpense.category}${newExpense.note ? ` - ${newExpense.note}` : ""}`,
        user.displayName || user.email
      );

      toast.success("Xərc əlavə edildi");
      setIsModalOpen(false);
      setNewExpense({ amount: "", category: "İcarə", note: "" });
      fetchExpenses();
    } catch (error) {
      console.error("Xərc əlavə edilərkən xəta:", error);
      toast.error("Xərc əlavə edilərkən xəta baş verdi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu xərci silmək istədiyinizə əminsiniz?")) return;
    try {
      await deleteDoc(doc(db, "expenses", id));
      toast.success("Xərc silindi");
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Xərc silinərkən xəta:", error);
      toast.error("Sizin bu əməliyyatı etmək üçün hüququnuz yoxdur");
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        (e.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.note || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [expenses, searchQuery]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [filteredExpenses]);

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
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Xərclər</h2>
          <p className="text-zinc-500 mt-1">Gündəlik və aylıq xərclərin idarə edilməsi</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Xərc
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-500 truncate" title="Cəmi Xərc (Göstərilən)">Cəmi Xərc (Göstərilən)</p>
            <p className="text-2xl font-bold text-zinc-900 truncate" title={`₼${totalExpenses.toFixed(2)}`}>₼{totalExpenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Kateqoriya və ya qeyd ilə axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Tarix</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Kateqoriya</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Qeyd</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Məbləğ</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Qeyd Edən</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    Xərc tapılmadı
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {expense.date?.toDate ? expense.date.toDate().toLocaleDateString("az-AZ") : ""}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-zinc-400" />
                        {expense.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{expense.note || "-"}</td>
                    <td className="px-6 py-4 font-bold text-red-600">₼{expense.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{expense.recordedBy}</td>
                    <td className="px-6 py-4 text-right">
                      {canManageStoreData(user, user.storeId) && (
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-6">Yeni Xərc</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Məbləğ (₼)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Kateqoriya</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              {cashboxes && cashboxes.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase">Ödənişin ediləcəyi kassa</label>
                  <select
                    value={selectedCashbox || ""}
                    onChange={(e) => setSelectedCashbox(e.target.value)}
                    className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="">Kassa seçin</option>
                    {cashboxes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.balance.toFixed(2)} ₼)</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Qeyd (İstəyə bağlı)</label>
                <textarea
                  value={newExpense.note}
                  onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                  rows={3}
                  placeholder="Xərc barədə əlavə məlumat..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 font-medium transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-medium transition-colors"
                >
                  Əlavə Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
