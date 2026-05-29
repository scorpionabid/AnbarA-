import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, where } from "firebase/firestore";
import { canManageStores } from "../lib/permissions";

export function useCashboxes(user: any) {
  const [cashboxes, setCashboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCashboxes = async () => {
      if (!user || (!canManageStores(user) && !user.storeId)) {
        setLoading(false);
        return;
      }
      try {
        let q = collection(db, "cashboxes") as any;
        if (!canManageStores(user)) {
          const storeId = user.storeId || "default";
          q = query(collection(db, "cashboxes"), where("storeId", "==", storeId));
        }
        const snap = await getDocs(q);
        setCashboxes(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
      } catch (error) {
        console.error("Error fetching cashboxes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCashboxes();
    }
  }, [user]);

  return { cashboxes, loading };
}
