import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { doc, updateDoc, writeBatch, serverTimestamp, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { updateLinkedCashboxTransaction } from "../../lib/financeUtils";

interface ViewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onSave: () => void;
  user: any;
}

export function ViewTransactionModal({ isOpen, onClose, transaction, onSave, user }: ViewTransactionModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [note, setNote] = useState(""); // reason for edit

  useEffect(() => {
    if (transaction) {
      // deep copy items to avoid mutating original
      // Handle the fact that sales items have 'price' and purchase items have 'purchasePrice' (or they both might have both)
      setItems((transaction.items || []).map((item: any) => ({ ...item })));
      setPaymentMethod(transaction.paymentMethod || "cash");
      setTotalAmount(transaction.totalAmount || 0);
      setNote("");
    }
  }, [transaction]);

  const handleQuantityChange = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, (item.quantity || 0) + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const calculateNewTotal = () => {
    // Basic recalculation. You might need to handle discount and tax if they are significant.
    // Assuming simple subtotal for now as an example, but if there's tax/discount, keep manual control over total.
    let sum = 0;
    items.forEach(item => {
      const price = transaction.type === "sale" ? (item.price || 0) : (item.purchasePrice || item.price || 0);
      sum += price * (item.quantity || 0);
    });
    // In real scenario, apply old discount % and tax % if needed
    return sum;
  };

  const handleSave = async () => {
    if (!note.trim()) {
      toast.error("Dəyişiklik üçün səbəb (qeyd) daxil etməlisiniz");
      return;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      // 1. Log the edit
      const logRef = doc(collection(db, "transaction_edit_logs"));
      batch.set(logRef, {
        transactionId: transaction.id,
        transactionType: transaction.type, // 'sale' or 'purchase'
        oldData: {
          items: transaction.items,
          totalAmount: transaction.totalAmount,
          paymentMethod: transaction.paymentMethod,
        },
        newData: {
          items,
          totalAmount,
          paymentMethod,
        },
        storeId: transaction.storeId || transaction.marketId || "default",
        editedBy: user.uid,
        editorName: user.displayName || user.email,
        note,
        editedAt: serverTimestamp()
      });

      // 2. Adjust Stock
      // For each item in the original and new arrays, calculate the delta
      const itemDeltas: Record<string, number> = {};
      
      transaction.items?.forEach((oldItem: any) => {
        itemDeltas[oldItem.id] = -(oldItem.quantity || 0); // start with negative old
      });
      items.forEach((newItem: any) => {
        if (!itemDeltas[newItem.id]) itemDeltas[newItem.id] = 0;
        itemDeltas[newItem.id] += (newItem.quantity || 0); // add new
      });

      // itemDeltas now holds: newQuantity - oldQuantity
      for (const [itemId, delta] of Object.entries(itemDeltas)) {
        if (delta !== 0) {
          const productRef = doc(db, "products", itemId);
          const productDoc = await getDoc(productRef);
          if (productDoc.exists()) {
            const currentStock = productDoc.data().stock || 0;
            let stockChange = 0;
            if (transaction.type === "sale") {
              // Sale: if delta > 0 (sold more), stock goes DOWN.
              stockChange = -delta;
            } else {
              // Purchase: if delta > 0 (bought more), stock goes UP.
              stockChange = delta;
            }
            batch.update(productRef, { stock: currentStock + stockChange });
          }
        }
      }

      // 3. Update Transaction
      const collectionName = transaction.type === "sale" ? "sales" : "purchases";
      const txRef = doc(db, collectionName, transaction.id);
      batch.update(txRef, {
        items,
        totalAmount,
        paymentMethod,
        updatedAt: serverTimestamp(),
        lastEditNote: note
      });

      // (Optional: update Client/Supplier Debt if paymentMethod == "credit". Left out for simplicity unless strictly required)
      if (transaction.type === "sale" || transaction.type === "purchase") {
        await updateLinkedCashboxTransaction(transaction.id, transaction.type, totalAmount, paymentMethod);
      }

      await batch.commit();
      toast.success("Əməliyyat uğurla dəyişdirildi");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error editing transaction:", error);
      toast.error("Xəta baş verdi");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h3 className="font-bold text-lg text-zinc-900">
            {transaction.type === "sale" ? "Satış" : "Alış"} Düzəlişi
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">Bu dəyişikliklər məhsulların anbar qalıqlarına təsir edəcək və dəyişiklik tarixçəsində qeyd olunacaq.</p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-zinc-900 mb-3">Məhsullar</h4>
            <div className="border border-zinc-200 rounded-xl divide-y divide-zinc-200">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-zinc-500">
                      Qiymət: {transaction.type === "sale" ? item.price : item.purchasePrice} ₼
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-zinc-50 rounded-lg p-1 border border-zinc-200">
                    <button 
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50"
                    >-</button>
                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setTotalAmount(calculateNewTotal())} 
              className="mt-2 text-xs text-blue-600 font-medium hover:underline"
            >
              Məbləği yenidən hesabla
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Yekun Məbləğ (₼)</label>
              <input 
                type="number" 
                value={totalAmount} 
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Ödəniş Növü</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="cash">Nəğd</option>
                <option value="card">Kart</option>
                <option value="credit">Nisyə</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Dəyişiklik Səbəbi</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Niyə bu əməliyyatı dəyişdirirsiniz?"
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
            />
          </div>

        </div>
        <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            Ləğv et
          </button>
          <button 
            onClick={handleSave} 
            disabled={isProcessing}
            className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? "Yadda saxlanılır..." : (
              <>
                <Save className="w-4 h-4" />
                Yadda saxla
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
