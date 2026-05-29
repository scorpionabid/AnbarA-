import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, query, where, getCountFromServer } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestoreUtils";

export function useAdminData(user: any) {
  const [stores, setStores] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState({ companyName: "AnbarAİ", vatRate: 18 });
  const [apiKeys, setApiKeys] = useState({ gemini: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role === 'super_admin' || user.role === 'store_admin') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let storesData = [];
      if (user.role === 'super_admin') {
        const storesSnap = await getDocs(collection(db, "stores"));
        storesData = storesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      } else if (user.storeId) {
        const storeDoc = await getDoc(doc(db, "stores", user.storeId));
        if (storeDoc.exists()) {
          storesData = [{ id: storeDoc.id, ...(storeDoc.data() as any) }];
        }
      }
      
      let usersQuery = query(collection(db, "users"));
      if (user.role !== 'super_admin') {
        const storeId = user.storeId || "default";
        usersQuery = query(collection(db, "users"), where("storeId", "==", storeId));
      }
      const usersSnap = await getDocs(usersQuery);
      
      const configDoc = await getDoc(doc(db, "config", "settings"));

      if (configDoc.exists()) {
        const data = configDoc.data();
        setAppSettings(data.appSettings || { companyName: "AnbarAİ", vatRate: 18 });
        setApiKeys(data.apiKeys || { gemini: "" });
      } else {
        setAppSettings({ companyName: "AnbarAİ", vatRate: 18 });
        setApiKeys({ gemini: "" });
      }

      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

      // Fetch product counts per store efficiently
      const enrichedStores = await Promise.all(storesData.map(async (store) => {
        const storeUsers = usersData.filter(u => u.storeId === store.id);
        const storeAdmins = storeUsers.filter(u => u.role === 'store_admin');
        
        // Instead of fetching all products, just get the count
        const productCountSnap = await getCountFromServer(
          query(collection(db, "products"), where("storeId", "==", store.id))
        );

        return {
          ...store,
          userCount: storeUsers.length,
          productVariety: productCountSnap.data().count,
          admins: storeAdmins.map(a => ({ name: a.displayName, email: a.email }))
        };
      }));

      setStores(enrichedStores);
      setUsers(usersData);
    } catch (error: any) {
      if (error?.message?.includes("Quota limit exceeded") || error?.code === "resource-exhausted") {
        console.warn("Admin data fetch error: Quota limit exceeded.");
      } else {
        console.error("Admin data fetch error:", error);
        handleFirestoreError(error, OperationType.LIST, "admin_data_fetch");
      }
    } finally {
      setLoading(false);
    }
  };

  return { stores, users, appSettings, apiKeys, loading, refreshData: fetchData };
}
