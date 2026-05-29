import React, { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc, writeBatch, orderBy, where, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Pencil, Trash2, Search, History, Loader2, ArrowRightLeft } from "lucide-react";
import { ViewTransactionModal } from "./ViewTransactionModal";

export function TransactionHistory({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
  }, [user.storeId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const salesQ = query(collection(db, "sales"), where("marketId", "==", user.storeId || "default"), orderBy("createdAt", "desc"));
      const purchasesQ = query(collection(db, "purchases"), where("storeId", "==", user.storeId || "default"), orderBy("createdAt", "desc"));
      
      const [salesSnap, purchasesSnap] = await Promise.all([getDocs(salesQ), getDocs(purchasesQ)]);
      
      const sales = salesSnap.docs.map(doc => ({ id: doc.id, type: "sale", ...doc.data() }));
      const purchases = purchasesSnap.docs.map(doc => ({ id: doc.id, type: "purchase", ...doc.data() }));
      
      const all = [...sales, ...purchases].sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA;
      });
      
      setTransactions(all);
    } catch (error) {
      console.error("Error fetching transactions", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-zinc-900">Bütün Əməliyyatlar</h3>
        <button onClick={fetchTransactions} className="p-2 bg-zinc-50 rounded-lg hover:bg-zinc-100">
          <History className="w-4 h-4 text-zinc-600" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-500">
                <th className="py-3 px-4 font-medium">Tarix</th>
                <th className="py-3 px-4 font-medium">Növ</th>
                <th className="py-3 px-4 font-medium">Müştəri/Təchizatçı</th>
                <th className="py-3 px-4 font-medium text-right">Məbləğ</th>
                <th className="py-3 px-4 font-medium text-center">Ödəniş</th>
                <th className="py-3 px-4 font-medium text-center">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors text-sm">
                  <td className="py-3 px-4 text-zinc-600">
                    {tx.createdAt ? tx.createdAt.toDate().toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      tx.type === "sale" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      "bg-blue-50 text-blue-600 border border-blue-100"
                    }`}>
                      {tx.type === "sale" ? "Satış" : "Alış"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-800">
                    {tx.clientName || tx.supplierName || "-"}
                  </td>
                  <td className="py-3 px-4 font-medium text-right text-zinc-900">
                    {tx.totalAmount?.toFixed(2)} ₼
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs text-zinc-500 capitalize">{tx.paymentMethod}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button 
                      onClick={() => setSelectedTx(tx)} 
                      className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 text-sm">Heç bir əməliyyat tapılmadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedTx && (
        <ViewTransactionModal 
          isOpen={!!selectedTx} 
          onClose={() => setSelectedTx(null)} 
          transaction={selectedTx} 
          onSave={fetchTransactions}
          user={user}
        />
      )}
    </div>
  );
}
