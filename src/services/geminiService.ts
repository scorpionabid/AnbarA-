import { GoogleGenAI, Type } from "@google/genai";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const getGeminiApiKey = async () => {
  try {
    const configDoc = await getDoc(doc(db, "config", "settings"));
    if (configDoc.exists()) {
      const data = configDoc.data();
      if (data.apiKeys && data.apiKeys.gemini) {
        return data.apiKeys.gemini;
      }
    }
  } catch (error) {
    console.warn("Could not fetch API key from settings", error);
  }
  return process.env.GEMINI_API_KEY || "";
};

export const analyzeInvoice = async (imageBase64: string) => {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) throw new Error("API quraşdırması tamamlanmayıb. Zəhmət olmasa admin paneldən daxil edin.");
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Analyze this handwritten Azerbaijani invoice (Qaimə).
    Extract the following fields in JSON format:
    - items: Array of { name: string, quantity: number, unitPrice: number }
    - totalAmount: number
    - date: string (ISO format if possible)
    - invoiceNumber: string
    
    Return ONLY the JSON.
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { text: prompt },
      { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unitPrice: { type: Type.NUMBER }
              },
              required: ["name", "quantity", "unitPrice"]
            }
          },
          totalAmount: { type: Type.NUMBER },
          date: { type: Type.STRING },
          invoiceNumber: { type: Type.STRING }
        },
        required: ["items", "totalAmount"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateProductImage = async (productName: string, brand: string) => {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) throw new Error("API quraşdırması tamamlanmayıb. Zəhmət olmasa admin paneldən daxil edin.");
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `A realistic high-quality e-commerce product photo of ${productName} ${brand}, studio lighting, white background.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });

  let rawDataUri = "";
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) {
        rawDataUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  }
  
  if (!rawDataUri) throw new Error("Image generation failed");

  // Resize and compress the image to fit in Firestore 1MB limit
  const resizedUri = await new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      
      const MAX_SIZE = 512;
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(rawDataUri); // fallback
      
      ctx.drawImage(img, 0, 0, width, height);
      // compress aggressively to ensure it fits in ~1MB easily
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => reject(new Error("Image processing failed"));
    img.src = rawDataUri;
  });

  return [resizedUri];
};
const safeStringify = (obj: any) => {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return '[Circular]';
      cache.add(value);
    }
    return value;
  });
};

export const predictStock = async (salesHistory: any[], currentStock: any[]) => {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) throw new Error("API quraşdırması tamamlanmayıb. Zəhmət olmasa admin paneldən daxil edin.");
  const ai = new GoogleGenAI({ apiKey });
  
  // Minimize payload size
  const minimalSales = salesHistory.slice(0, 10).map(s => ({
    date: s.createdAt,
    items: s.items?.map((i: any) => ({ n: i.name, q: i.quantity }))
  }));
  const minimalStock = currentStock.map(p => ({
    id: p.id,
    n: p.name,
    s: p.stock
  })).slice(0, 30);

  const prompt = `
    Based on the following sales history and current stock levels, predict which items need restocking and suggest quantities.
    Sales: ${safeStringify(minimalSales)}
    Stock: ${safeStringify(minimalStock)}
    
    Return a JSON array of { productId: string, suggestedQuantity: number, reason: string }.
    Return ONLY the JSON.
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ text: prompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            productId: { type: Type.STRING },
            suggestedQuantity: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          },
          required: ["productId", "suggestedQuantity", "reason"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};
