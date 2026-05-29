import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function triggerWebhook(storeId: string, event: string, entity: string, payload: any) {
  if (!storeId || storeId === "default") return;
  try {
    const storeDoc = await getDoc(doc(db, "stores", storeId));
    if (!storeDoc.exists()) return;
    const storeData = storeDoc.data();
    if (!storeData.apiKey) return;

    await fetch(`/api/v1/webhook/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": storeData.apiKey
      },
      body: JSON.stringify({ event, entity, payload })
    });
  } catch (error) {
    console.error("Failed to trigger webhook:", error);
  }
}
