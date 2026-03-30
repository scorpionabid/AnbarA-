import { collection, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export async function seedDatabase(storeId: string, userId: string) {
  try {
    const batch = writeBatch(db);

    // 1. Fetch & Add Categories
    const catRes = await fetch('https://dummyjson.com/products/categories');
    const categories = await catRes.json();
    const categoryMap = new Map(); // name -> id

    // Just take first 5 categories to not overload
    for (const cat of categories.slice(0, 5)) {
      const catRef = doc(collection(db, "categories"));
      const catName = typeof cat === 'string' ? cat : cat.name;
      batch.set(catRef, {
        name: catName,
        description: "Avtomatik əlavə edilib",
        storeId,
        createdAt: serverTimestamp()
      });
      categoryMap.set(catName, catRef.id);
    }

    // 2. Fetch & Add Products
    const prodRes = await fetch('https://dummyjson.com/products?limit=20');
    const prodData = await prodRes.json();
    const productsList: any[] = [];

    for (const p of prodData.products) {
      const prodRef = doc(collection(db, "products"));
      const catName = p.category;
      
      // If category doesn't exist in our map, use a default or create one
      let categoryId = categoryMap.get(catName);
      if (!categoryId) {
         const newCatRef = doc(collection(db, "categories"));
         batch.set(newCatRef, { 
           name: catName, 
           description: "Avtomatik əlavə edilib", 
           storeId, 
           createdAt: serverTimestamp() 
         });
         categoryId = newCatRef.id;
         categoryMap.set(catName, categoryId);
      }

      batch.set(prodRef, {
        name: p.title,
        sku: `SKU-${p.id}`,
        barcode: `1000000${p.id}`,
        categoryId: categoryId,
        purchasePrice: p.price * 0.7, // 30% margin
        price: p.price,
        stock: p.stock,
        minStock: 5,
        unit: "ədəd",
        description: p.description,
        imageUrl: p.thumbnail,
        storeId,
        createdAt: serverTimestamp()
      });

      // Add inventory log
      const logRef = doc(collection(db, "inventory_logs"));
      batch.set(logRef, {
        productId: prodRef.id,
        productName: p.title,
        type: "create",
        change: p.stock,
        oldStock: 0,
        newStock: p.stock,
        userId,
        userEmail: "system@api.com",
        storeId,
        timestamp: serverTimestamp()
      });
      
      productsList.push({
        id: prodRef.id,
        name: p.title,
        price: p.price,
        purchasePrice: p.price * 0.7
      });
    }

    // 3. Fetch & Add Contacts (Clients/Suppliers)
    const userRes = await fetch('https://dummyjson.com/users?limit=10');
    const userData = await userRes.json();
    const clientsList: any[] = [];

    for (let i = 0; i < userData.users.length; i++) {
      const u = userData.users[i];
      const contactRef = doc(collection(db, "contacts"));
      const isClient = i < 7; // 7 clients, 3 suppliers
      const debtAmount = isClient ? Math.floor(Math.random() * 500) : 0;
      batch.set(contactRef, {
        name: `${u.firstName} ${u.lastName}`,
        type: isClient ? "client" : "supplier",
        phone: u.phone,
        email: u.email,
        address: `${u.address.city}, ${u.address.address}`,
        taxId: u.bank.cardNumber.substring(0, 10),
        debt: debtAmount,
        storeId,
        createdAt: serverTimestamp()
      });
      
      if (isClient) {
        clientsList.push({
          id: contactRef.id,
          name: `${u.firstName} ${u.lastName}`,
          debt: debtAmount
        });
      }
    }

    // 4. Generate some random sales
    for (let i = 0; i < 15; i++) {
      const saleRef = doc(collection(db, "sales"));
      const randomClient = clientsList[Math.floor(Math.random() * clientsList.length)];
      
      // Pick 1-3 random products
      const numItems = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let totalAmount = 0;
      
      for (let j = 0; j < numItems; j++) {
        const randomProduct = productsList[Math.floor(Math.random() * productsList.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const amount = randomProduct.price * quantity;
        totalAmount += amount;
        
        items.push({
          id: randomProduct.id,
          name: randomProduct.name,
          price: randomProduct.price,
          purchasePrice: randomProduct.purchasePrice,
          quantity
        });
      }
      
      // Random date within last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      batch.set(saleRef, {
        items,
        totalAmount,
        paymentMethod: Math.random() > 0.5 ? "cash" : "card",
        status: "completed",
        channel: Math.random() > 0.7 ? "online" : "offline",
        clientId: randomClient.id,
        clientName: randomClient.name,
        userId,
        userEmail: "system@api.com",
        storeId,
        createdAt: date
      });
    }

    // 5. Generate some debt payments
    for (const client of clientsList) {
      if (client.debt > 0) {
        const paymentRef = doc(collection(db, "debt_payments"));
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 15));
        
        batch.set(paymentRef, {
          contactId: client.id,
          contactName: client.name,
          amount: Math.floor(client.debt * 0.3), // Paid 30% of debt
          type: "payment_in",
          note: "Demo ödəniş",
          userId,
          userEmail: "system@api.com",
          storeId,
          createdAt: date
        });
      }
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Seeding error:", error);
    throw error;
  }
}
