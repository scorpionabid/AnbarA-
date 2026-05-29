import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function logAdminAction(adminId: string, action: string, details: any) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      adminId,
      action,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
