
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkProduct() {
  const q = query(collection(db, "products"), where("sku", "==", "Motor-0092"));
  const snap = await getDocs(q);
  if (snap.empty) {
    const q2 = query(collection(db, "products"), where("name", "==", "Motor-0092"));
    const snap2 = await getDocs(q2);
    if (snap2.empty) {
      console.log("NOT_FOUND");
    } else {
      console.log("FOUND_BY_NAME:" + snap2.docs[0].id);
    }
  } else {
    console.log("FOUND_BY_SKU:" + snap.docs[0].id);
  }
}

checkProduct().catch(console.error);
