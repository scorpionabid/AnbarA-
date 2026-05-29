
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function investigate() {
  console.log("--- Store Investigation ---");
  const storesSnap = await getDocs(collection(db, "stores"));
  let texnobabaId = null;
  storesSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Store: ${data.name}, ID: ${doc.id}`);
    if (data.name && data.name.toLowerCase().includes("texnobaba")) {
      texnobabaId = doc.id;
    }
  });

  if (texnobabaId) {
    console.log(`\n--- Product Investigation for Store ID: ${texnobabaId} ---`);
    const q = query(collection(db, "products"), where("storeId", "==", texnobabaId));
    const prodSnap = await getDocs(q);
    let found = false;
    prodSnap.forEach(doc => {
      const p = doc.data();
      if (p.name === "Motor-0092" || p.sku === "Motor-0092") {
        console.log(`FOUND: ${p.name} (SKU: ${p.sku}), ID: ${doc.id}, Stock: ${p.stock}`);
        found = true;
      }
    });
    if (!found) console.log("Product 'Motor-0092' NOT FOUND in Texnobaba inventory.");
  } else {
    console.log("\nStore 'Texnobaba' not found in 'stores' collection.");
    
    // Check users to see if any user belongs to a store named Texnobaba (if store name is stored in user doc)
    // Or just check all products for any mention of Motor-0092 to see their storeId
    console.log("\n--- Checking all products for 'Motor-0092' ---");
    const allProdSnap = await getDocs(collection(db, "products"));
    allProdSnap.forEach(doc => {
      const p = doc.data();
      if (p.name === "Motor-0092" || p.sku === "Motor-0092") {
        console.log(`FOUND in DB: ${p.name}, StoreID: ${p.storeId}, DocID: ${doc.id}`);
      }
    });
  }
}

investigate().catch(err => {
  if (err.code === 'permission-denied') {
    console.log("PERMISSION_DENIED: I cannot query the DB directly due to security rules. I will analyze the code instead.");
  } else {
    console.error(err);
  }
});
