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
import { toast } from "sonner";
import { DebtList } from "./debts/DebtList";
import { DebtDetails } from "./debts/DebtDetails";
import { PaymentModal } from "./debts/PaymentModal";
import { useCashboxes } from "../hooks/useCashboxes";
import { addCashboxTransaction } from "../lib/financeUtils";

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
  const { cashboxes } = useCashboxes(user);
  const [selectedCashbox, setSelectedCashbox] = useState<string>("");

  useEffect(() => {
    if (cashboxes && cashboxes.length > 0 && !selectedCashbox) {
      setSelectedCashbox(cashboxes[0].id);
    }
  }, [cashboxes, selectedCashbox]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    if (user.role !== "super_admin" && !user.storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let q = query(collection(db, "contacts"), where("type", "==", "client"), where("debt", ">", 0), limit(300));
      if (user.role !== "super_admin") {
        const storeId = user.storeId || "default";
        q = query(collection(db, "contacts"), where("type", "==", "client"), where("storeId", "==", storeId), where("debt", ">", 0), limit(300));
      }
      const snap = await getDocs(q);
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Müştərilər yüklənərkən xəta:", error);
      toast.error("Məlumatlar yüklənərkən xəta baş verdi");
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
      toast.error("Tarixçə yüklənərkən xəta baş verdi");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !paymentAmount || isProcessing) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (!selectedCashbox) {
      toast.error("Ödənişin daxil olacağı kassanı seçin");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Record the payment
      const paymentRef = await addDoc(collection(db, "debt_payments"), {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        amount,
        note: paymentNote,
        recordedBy: user.uid,
        storeId: user.storeId || "default",
        createdAt: serverTimestamp(),
      });

      // 1.5 Record Cashbox Transaction
      await addCashboxTransaction(
        selectedCashbox,
        user.storeId || "default",
        "income", // Debt payment is income
        amount,
        `Qalıq borc ödənişi: ${selectedClient.name}${paymentNote ? ` - ${paymentNote}` : ""}`,
        user.displayName || user.email
      );

      // 2. Update client debt
      await updateDoc(doc(db, "contacts", selectedClient.id), {
        debt: increment(-amount)
      });

      // 3. Success
      toast.success("Ödəniş uğurla qeyd edildi.");
      setIsPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentNote("");
      fetchClients();
      if (selectedClient) fetchHistory(selectedClient.id);
      
      // Update selected client local state
      setSelectedClient({ ...selectedClient, debt: selectedClient.debt - amount });
    } catch (error) {
      console.error("Ödəniş zamanı xəta:", error);
      toast.error("Ödəniş qeyd edilərkən xəta baş verdi.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-auto lg:h-[calc(100vh-12rem)]">
      <DebtList 
        clients={clients}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedClient={selectedClient}
        onSelectClient={(client) => {
          setSelectedClient(client);
          fetchHistory(client.id);
        }}
        loading={loading}
      />

      <div className="w-full lg:w-[450px] flex flex-col bg-white border border-zinc-100 rounded-[2.5rem] overflow-hidden hover:shadow-sm transition-all min-h-[500px] lg:min-h-0">
        <DebtDetails 
          selectedClient={selectedClient}
          history={history}
          historyLoading={historyLoading}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        />
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedClient={selectedClient}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentNote={paymentNote}
        setPaymentNote={setPaymentNote}
        handlePayment={handlePayment}
        isProcessing={isProcessing}
        cashboxes={cashboxes}
        selectedCashbox={selectedCashbox}
        setSelectedCashbox={setSelectedCashbox}
      />
    </div>
  );
}
