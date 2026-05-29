import { db } from "../firebase";
import { collection, doc, getDoc, Timestamp, writeBatch, query, where, getDocs } from "firebase/firestore";

export async function addCashboxTransaction(
  cashboxId: string,
  storeId: string,
  type: "income" | "expense",
  amount: number,
  description: string,
  recordedBy: string,
  linkedId?: string,
  linkedType?: "sale" | "purchase" | "return" | "expense"
) {
  if (!cashboxId || !amount) return;

  const batch = writeBatch(db);

  // 1. Create Transaction Record
  const txRef = doc(collection(db, "cashbox_transactions"));
  batch.set(txRef, {
    cashboxId,
    storeId,
    type,
    amount,
    description,
    recordedBy,
    date: Timestamp.now(),
    linkedId: linkedId || null,
    linkedType: linkedType || null
  });

  // 2. Update Cashbox Balance
  const cashboxRef = doc(db, "cashboxes", cashboxId);
  const cashboxDoc = await getDoc(cashboxRef);
  
  if (cashboxDoc.exists()) {
    const currentBalance = cashboxDoc.data().balance || 0;
    const newBalance = type === "income" ? currentBalance + amount : currentBalance - amount;
    batch.update(cashboxRef, { balance: newBalance });
  }

  await batch.commit();
}

export async function updateLinkedCashboxTransaction(
  linkedId: string,
  linkedType: "sale" | "purchase" | "return" | "expense",
  newAmount: number,
  newPaymentMethod: string
) {
  const q = query(collection(db, "cashbox_transactions"), where("linkedId", "==", linkedId), where("linkedType", "==", linkedType));
  const snap = await getDocs(q);
  
  const batch = writeBatch(db);

  if (snap.empty) {
    return;
  }

  // usually there's only one
  const txDoc = snap.docs[0];
  const txData = txDoc.data();
  const oldAmount = txData.amount;
  const cashboxId = txData.cashboxId;

  if (newPaymentMethod === "credit") {
    // delete cashbox transaction, refund balance
    batch.delete(txDoc.ref);
    const cashboxRef = doc(db, "cashboxes", cashboxId);
    const cashboxSnap = await getDoc(cashboxRef);
    if (cashboxSnap.exists()) {
       const balance = cashboxSnap.data().balance || 0;
       const revertedBalance = txData.type === "income" ? balance - oldAmount : balance + oldAmount;
       batch.update(cashboxRef, { balance: revertedBalance });
    }
  } else {
    // just update amount if it changed
    if (oldAmount !== newAmount) {
       batch.update(txDoc.ref, { amount: newAmount });
       const cashboxRef = doc(db, "cashboxes", cashboxId);
       const cashboxSnap = await getDoc(cashboxRef);
       if (cashboxSnap.exists()) {
          const balance = cashboxSnap.data().balance || 0;
          // remove old, add new
          let newBalance = txData.type === "income" ? balance - oldAmount : balance + oldAmount; // revert old
          newBalance = txData.type === "income" ? newBalance + newAmount : newBalance - newAmount; // apply new
          batch.update(cashboxRef, { balance: newBalance });
       }
    }
  }
  
  await batch.commit();
}

