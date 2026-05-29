import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, doc, where, orderBy, Timestamp, writeBatch, getDoc, limit } from "firebase/firestore";
import { Plus, Search, Loader2, Truck, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useCashboxes } from "../hooks/useCashboxes";
import { addCashboxTransaction } from "../lib/financeUtils";

export function SupplierPayments({ user }: { user: any }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { cashboxes } = useCashboxes(user);
  const [selectedCashbox, setSelectedCashbox] = useState<string>("");

  const [newPayment, setNewPayment] = useState({
    supplierId: "",
    amount: "",
    note: "",
  });

  useEffect(() => {
    if (cashboxes && cashboxes.length > 0 && !selectedCashbox) {
      setSelectedCashbox(cashboxes[0].id);
    }
  }, [cashboxes, selectedCashbox]);

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
      let paymentsQ = query(collection(db, "supplier_payments"), orderBy("createdAt", "desc"), limit(300));
      let suppliersQ = query(collection(db, "contacts"), where("type", "==", "supplier"));

      if (user.role !== "super_admin") {
        const storeId = user.storeId || "default";
        paymentsQ = query(collection(db, "supplier_payments"), where("storeId", "==", storeId), orderBy("createdAt", "desc"), limit(300));
        suppliersQ = query(collection(db, "contacts"), where("type", "==", "supplier"), where("storeId", "==", storeId));
      }

      const [paymentsSnap, suppliersSnap] = await Promise.all([
        getDocs(paymentsQ),
        getDocs(suppliersQ)
      ]);

      setPayments(paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      
      const loadedSuppliers = suppliersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSuppliers(loadedSuppliers);

      if (loadedSuppliers.length > 0 && !newPayment.supplierId) {
        setNewPayment(prev => ({ ...prev, supplierId: loadedSuppliers[0].id }));
      }
    } catch (error) {
      console.error("Ödənişlər yüklənərkən xəta:", error);
      toast.error("Məlumatlar yüklənərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.supplierId || !newPayment.amount || isNaN(Number(newPayment.amount))) {
      toast.error("Düzgün məlumat daxil edin");
      return;
    }

    if (!selectedCashbox) {
      toast.error("Ödənişin silinəcəyi kassanı seçin");
      return;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const storeId = user.storeId || "demo-store";
      const amount = Number(newPayment.amount);
      const supplier = suppliers.find(s => s.id === newPayment.supplierId);

      if (!supplier) throw new Error("Təchizatçı tapılmadı");

      // 1. Create Payment Record
      const paymentRef = doc(collection(db, "supplier_payments"));
      batch.set(paymentRef, {
        supplierId: supplier.id,
        supplierName: supplier.name,
        amount,
        note: newPayment.note,
        recordedBy: user.displayName || user.email,
        storeId,
        createdAt: Timestamp.now(),
      });

      // 2. Update Supplier Debt (Decrease debt)
      const supplierRef = doc(db, "contacts", supplier.id);
      const supplierDoc = await getDoc(supplierRef);
      
      if (supplierDoc.exists()) {
        const currentDebt = supplierDoc.data().debt || 0;
        const newDebt = Math.max(0, currentDebt - amount); // Prevent negative debt if overpaid
        batch.update(supplierRef, { debt: newDebt });
      }

      await batch.commit();

      // 3. Record Cashbox Transaction
      await addCashboxTransaction(
        selectedCashbox,
        storeId,
        "expense", // outgoing payment
        amount,
        `Təchizatçı ödənişi: ${supplier.name}${newPayment.note ? ` - ${newPayment.note}` : ""}`,
        user.displayName || user.email
      );

      toast.success("Ödəniş uğurla qeydə alındı");
      setIsModalOpen(false);
      setNewPayment({ ...newPayment, amount: "", note: "" });
      fetchData();
    } catch (error) {
      console.error("Ödəniş xətası:", error);
      toast.error("Əməliyyat zamanı xəta baş verdi");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        (p.supplierName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.note || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [payments, searchQuery]);

  const totalPayments = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [filteredPayments]);

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
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Təchizatçı Ödənişləri</h2>
          <p className="text-zinc-500 mt-1">Zavodlara və topdansatışlara edilən ödənişlər</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Ödəniş
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Cəmi Ödəniş (Göstərilən)</p>
            <p className="text-2xl font-bold text-zinc-900">₼{totalPayments.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Təchizatçı adı və ya qeyd ilə axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Tarix</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Təchizatçı</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Məbləğ</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Qeyd</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">İcra Edən</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    Ödəniş tapılmadı
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {payment.createdAt?.toDate ? payment.createdAt.toDate().toLocaleDateString("az-AZ") : ""}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-zinc-400" />
                        {payment.supplierName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-sm font-bold w-max">
                        <ArrowUpRight className="w-4 h-4" />
                        ₼{payment.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{payment.note || "-"}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{payment.recordedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-6">Yeni Ödəniş</h3>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Təchizatçı</label>
                <select
                  required
                  value={newPayment.supplierId}
                  onChange={(e) => setNewPayment({ ...newPayment, supplierId: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Borcumuz: ₼{(s.debt || 0).toFixed(2)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Məbləğ (₼)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="0.00"
                />
              </div>
              {cashboxes && cashboxes.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase">Ödənişin ediləcəyi kassa</label>
                  <select
                    required
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
                  value={newPayment.note}
                  onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                  rows={2}
                  placeholder="Ödəniş barədə məlumat..."
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
                  disabled={isProcessing || suppliers.length === 0}
                  className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Təsdiqlə"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
