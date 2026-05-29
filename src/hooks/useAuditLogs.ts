import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export function useAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      } catch (error) {
        console.error("Audit logs fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return { logs, loading };
}
