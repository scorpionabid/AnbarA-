import React, { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "../../firebase";
import { FileClock, Loader2, ArrowRight } from "lucide-react";

export function TransactionEditLogs({ user }: { user: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [user.storeId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Allow viewing all logs for super_admin, filter for store_admin
      let logsQ = query(collection(db, "transaction_edit_logs"), orderBy("editedAt", "desc"));
      if (user.role !== "super_admin") {
        logsQ = query(collection(db, "transaction_edit_logs"), where("storeId", "==", user.storeId || "default"), orderBy("editedAt", "desc"));
      }
      
      const snap = await getDocs(logsQ);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching logs", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
          <FileClock className="w-5 h-5 text-blue-500" />
          Dəyişiklik Loqları
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="bg-zinc-50 border border-zinc-100 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 text-sm">{log.editorName}</span>
                    <span className="text-zinc-400 text-xs text-xs px-2 py-0.5 bg-white border border-zinc-200 rounded-md">
                      {log.transactionType === "sale" ? "Satış" : "Alış"}
                    </span>
                    <span className="text-zinc-500 text-xs">#{log.transactionId?.slice(-6).toUpperCase()} əməliyyatını dəyişdirdi</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {log.editedAt ? log.editedAt.toDate().toLocaleDateString('az-AZ', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-"}
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-zinc-100 rounded-lg p-3 text-sm grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 mb-1">Əvvəl:</h4>
                  <p className="text-zinc-600">Məbləğ: {log.oldData?.totalAmount} ₼</p>
                  <p className="text-zinc-600">Ödəniş növü: {log.oldData?.paymentMethod}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-400 mb-1">Sonra:</h4>
                  <p className="text-zinc-900 font-medium">Məbləğ: {log.newData?.totalAmount} ₼</p>
                  <p className="text-zinc-900 font-medium">Ödəniş növü: {log.newData?.paymentMethod}</p>
                </div>
              </div>

              {log.note && (
                <div className="mt-3 text-sm">
                  <span className="font-medium text-zinc-700">Səbəb: </span>
                  <span className="text-zinc-600 italic">{log.note}</span>
                </div>
              )}
            </div>
          ))}
          
          {logs.length === 0 && (
            <div className="text-center py-8 text-zinc-500 text-sm">
              Heç bir dəyişiklik loqu tapılmadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
