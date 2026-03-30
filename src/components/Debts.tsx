import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp,
  orderBy,
  limit
} from "firebase/firestore";
import { 
  Wallet, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Loader2, 
  CheckCircle, 
  X,
  Plus,
  History,
  User
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function Debts({ user }: { user: any }) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, "contacts"), where("type", "==", "client"), where("debt", ">", 0));
      if (user.role !== "super_admin") {
        q = query(q, where("storeId", "==", user.storeId));
      }
      const snap = await getDocs(q);
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Müştərilər yüklənərkən xəta:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (clientId: string) => {
    setHistoryLoading(true);
    try {
      // Fetch sales and payments
      const [salesSnap, paymentsSnap] = await Promise.all([
        getDocs(query(
          collection(db, "sales"), 
          where("clientId", "==", clientId),
          where("paymentMethod", "==", "credit"),
          orderBy("createdAt", "desc"),
          limit(20)
        )),
        getDocs(query(
          collection(db, "debt_payments"), 
          where("clientId", "==", clientId),
          orderBy("createdAt", "desc"),
          limit(20)
        ))
      ]);

      const sales = salesSnap.docs.map(d => ({ id: d.id, type: "sale", ...d.data() }));
      const payments = paymentsSnap.docs.map(d => ({ id: d.id, type: "payment", ...d.data() }));
      
      const combined = [...sales, ...payments].sort((a: any, b: any) => 
        (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      
      setHistory(combined);
    } catch (error) {
      console.error("Tarixçə yüklənərkən xəta:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !paymentAmount || isProcessing) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    try {
      // 1. Record the payment
      await addDoc(collection(db, "debt_payments"), {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        amount,
        note: paymentNote,
        recordedBy: user.uid,
        storeId: user.storeId || "default",
        createdAt: serverTimestamp(),
      });

      // 2. Update client debt
      await updateDoc(doc(db, "contacts", selectedClient.id), {
        debt: increment(-amount)
      });

      // 3. Success
      setIsPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentNote("");
      fetchClients();
      if (selectedClient) fetchHistory(selectedClient.id);
      
      // Update selected client local state
      setSelectedClient({ ...selectedClient, debt: selectedClient.debt - amount });
    } catch (error) {
      console.error("Ödəniş zamanı xəta:", error);
      alert("Ödəniş qeyd edilərkən xəta baş verdi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-12rem)]">
      {/* Left Side: Debt List */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <header>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Nisyə İdarəetməsi</h2>
          <p className="text-zinc-500 mt-1">Müştəri borcları və ödəniş tarixçəsi.</p>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Müştəri axtar..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-zinc-400" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client);
                    fetchHistory(client.id);
                  }}
                  className={cn(
                    "flex flex-col p-6 rounded-3xl border transition-all text-left group",
                    selectedClient?.id === client.id 
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-xl" 
                    : "bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-sm"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                      selectedClient?.id === client.id ? "bg-white/10" : "bg-zinc-100 text-zinc-900"
                    )}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-lg",
                      selectedClient?.id === client.id ? "bg-white/20 text-white" : "bg-red-50 text-red-600"
                    )}>
                      Borc
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-1">{client.name}</h4>
                  <p className={cn(
                    "text-xs mb-4",
                    selectedClient?.id === client.id ? "text-zinc-400" : "text-zinc-500"
                  )}>
                    {client.phone || "Telefon yoxdur"}
                  </p>
                  <div className="mt-auto pt-4 border-t border-current opacity-20 flex justify-between items-end">
                    <span className="text-sm font-medium">Cəmi Borc:</span>
                    <span className="text-2xl font-black">₼{client.debt}</span>
                  </div>
                </button>
              ))}
              {filteredClients.length === 0 && (
                <div className="col-span-full p-12 text-center text-zinc-500 bg-white border border-zinc-200 rounded-3xl">
                  Borcu olan müştəri tapılmadı.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Details & History */}
      <div className="w-full lg:w-[450px] flex flex-col bg-white border border-zinc-100 rounded-[2.5rem] overflow-hidden hover:shadow-sm transition-all">
        {!selectedClient ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-12 text-center">
            <Wallet className="w-16 h-16 mb-4 opacity-10" />
            <h3 className="font-bold text-lg text-zinc-900">Müştəri Seçilməyib</h3>
            <p className="text-sm mt-2">Borc tarixçəsini görmək və ödəniş qəbul etmək üçün soldan bir müştəri seçin.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-8 border-b border-zinc-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900">{selectedClient.name}</h3>
                  <p className="text-zinc-500 text-sm">{selectedClient.phone || "Əlaqə nömrəsi yoxdur"}</p>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ödəniş Al
                </button>
              </div>

              <div className="bg-zinc-50 p-6 rounded-3xl flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Cari Borc</span>
                <span className="text-3xl font-black text-red-600">₼{selectedClient.debt}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-4 h-4 text-zinc-400" />
                <h4 className="font-bold text-zinc-900">Son Əməliyyatlar</h4>
              </div>

              {historyLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zinc-300" /></div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        item.type === "sale" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {item.type === "sale" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-sm text-zinc-900 truncate">
                            {item.type === "sale" ? "Nisyə Satış" : "Borc Ödənişi"}
                          </h5>
                          <span className={cn(
                            "font-black text-sm",
                            item.type === "sale" ? "text-red-600" : "text-emerald-600"
                          )}>
                            {item.type === "sale" ? "+" : "-"}₼{item.type === "sale" ? item.totalAmount : item.amount}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {item.createdAt?.toDate().toLocaleString('az-AZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {item.note && (
                          <p className="mt-2 text-xs text-zinc-500 italic bg-zinc-50 p-2 rounded-lg">"{item.note}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="text-center text-zinc-400 py-8 text-sm">Əməliyyat tarixçəsi yoxdur.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative mt-auto sm:my-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold mb-2">Ödəniş Qəbulu</h3>
            <p className="text-zinc-500 text-sm mb-6">{selectedClient?.name} tərəfindən edilən ödəniş.</p>
            
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Məbləğ (₼)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xl font-black focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Qeyd (Könüllü)</label>
                <textarea
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  placeholder="Ödəniş haqqında qeyd..."
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : "Ödənişi Təsdiqlə"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
