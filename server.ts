import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import { initializeApp, cert, applicationDefault, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
try {
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credential = cert(serviceAccount);
  } else {
    credential = applicationDefault();
  }
  
  initializeApp({
    credential
  });
  console.log("Firebase Admin initialized.");
} catch (error) {
  console.warn("Failed to initialize Firebase Admin. Make sure FIREBASE_SERVICE_ACCOUNT environment variable is set if not running in GCP.", error);
}

// Get correct Firestore database
let db: Firestore;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configRaw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configRaw);
    db = config.firestoreDatabaseId ? getFirestore(getApp(), config.firestoreDatabaseId) : getFirestore();
  } else {
    db = getFirestore();
  }
} catch (e) {
  db = getFirestore();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // ==========================================
  // Public API Endpoints for Integration (B2B API)
  // ==========================================

  // Middleware to verify API key
  const requireApiKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;

      if (!apiKey) {
         res.status(401).json({ error: "Unauthorized. Missing API Key (X-API-KEY header)." });
         return;
      }
      
      const storesRef = db.collection('stores');
      const snapshot = await storesRef.where('apiKey', '==', apiKey).limit(1).get();
      
      if (snapshot.empty) {
         res.status(401).json({ error: "Unauthorized. Invalid API Key." });
         return;
      }
      
      const storeDoc = snapshot.docs[0];
      res.locals.storeId = storeDoc.id;
      res.locals.storeData = storeDoc.data();

      next();
    } catch (e: any) {
      console.error("Auth Middleware Error:", e);
      if (e.message?.includes("PERMISSION_DENIED") || e.message?.includes("SERVICE_DISABLED")) {
        res.status(500).json({ error: "Backend config error: FIREBASE_SERVICE_ACCOUNT is missing or invalid." });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };

  // 2. Product API Endpoint
  app.get("/api/v1/products", requireApiKey, async (req, res) => {
    try {
      const storeId = res.locals.storeId;
      const productsRef = db.collection('products');
      const snapshot = await productsRef.where('storeId', '==', storeId).get();
      
      const products: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Image Optimization: convert Base64 to URL
        let finalImageUrl = data.imageUrl;
        if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
            finalImageUrl = `${req.protocol}://${req.get('host')}/api/v1/products/${doc.id}/image`;
        } else if (finalImageUrl === undefined) {
            finalImageUrl = null;
        }

        // Data Filtering: Only expose safe fields
        products.push({
          id: doc.id,
          name: data.name,
          price: data.price, // only sell price
          stock: data.stock,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          imageUrl: finalImageUrl,
          // Optional useful fields for e-commerce
          description: data.description || "",
          status: data.status || "active",
          createdAt: data.createdAt?.toDate?.()
        });
      });
      res.json({ products });
    } catch (error: any) {
      console.error("Error fetching API products:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Image serving endpoint for base64 optimization
  app.get("/api/v1/products/:id/image", async (req, res) => {
     try {
        const { id } = req.params;
        const doc = await db.collection('products').doc(id).get();
        if (!doc.exists) {
           res.status(404).send("Not found");
           return;
        }
        const data = doc.data();
        if (data?.imageUrl && data.imageUrl.startsWith('data:image')) {
           const matches = data.imageUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
           if (matches && matches.length === 3) {
              const contentType = matches[1];
              const buffer = Buffer.from(matches[2], 'base64');
              res.set('Content-Type', contentType);
              res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
              res.send(buffer);
              return;
           }
        }
        // If not base64, redirect if an ordinary URL, or 404
        if (data?.imageUrl && data.imageUrl.startsWith('http')) {
           res.redirect(data.imageUrl);
           return;
        }
        res.status(404).send("No image");
     } catch(e) {
        res.status(500).send("Error fetching image");
     }
  });

  // Get categories for a store
  app.get("/api/v1/categories", requireApiKey, async (req, res) => {
    try {
      const storeId = res.locals.storeId;
      const categoriesRef = db.collection('categories');
      const snapshot = await categoriesRef.where('storeId', '==', storeId).get();
      
      const categories: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        categories.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          parentId: data.parentId || null,
          status: data.status || "active",
        });
      });
      res.json({ categories });
    } catch (error: any) {
      console.error("Error fetching API categories:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook trigger endpoint
  app.post("/api/v1/webhook/trigger", requireApiKey, async (req, res) => {
    try {
      const storeData = res.locals.storeData;
      const { event, entity, payload } = req.body;
      
      if (!storeData?.webhookUrl) {
         res.json({ success: true, message: "No webhook configured" });
         return;
      }

      // Sanitize payload data for B2B API
      let safePayload = { ...payload };
      if (entity === "product") {
         let finalImageUrl = safePayload.imageUrl;
         if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
             finalImageUrl = `${req.protocol}://${req.get('host')}/api/v1/products/${safePayload.id}/image`;
         } else if (finalImageUrl === undefined) {
             finalImageUrl = null;
         }

         safePayload = {
            id: safePayload.id,
            name: safePayload.name,
            price: safePayload.price,
            stock: safePayload.stock,
            categoryId: safePayload.categoryId,
            categoryName: safePayload.categoryName,
            imageUrl: finalImageUrl,
            description: safePayload.description || "",
            status: safePayload.status || "active",
         };
      }
      
      // Dispatch webhook asynchronously
      fetch(storeData.webhookUrl, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
             event, // e.g. "product.created", "product.updated", "product.deleted"
             entity, // e.g. "product"
             data: safePayload,
             timestamp: new Date().toISOString() 
         })
      }).catch(err => console.error("Failed to dispatch webhook:", err));
      
      res.json({ success: true, message: "Webhook triggered" });
    } catch (error: any) {
      console.error("Webhook trigger error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create an explicit endpoint for automated webhooks trigger by frontend
  app.post("/api/v1/internal/webhook/trigger", async (req, res) => {
    try {
        const { storeId, event, entity, payload } = req.body;
        const storeDoc = await db.collection('stores').doc(storeId).get();
        if(storeDoc.exists && storeDoc.data()?.webhookUrl) {
           const webhookUrl = storeDoc.data()?.webhookUrl;
           fetch(webhookUrl, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ event, entity, data: payload, timestamp: new Date().toISOString() })
           }).catch(e => console.error(e));
        }
        res.json({success: true});
    } catch(e) {
        res.status(500).json({success: false});
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
