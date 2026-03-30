import { GoogleGenAI, Type } from "@google/genai";

export const analyzeInvoice = async (imageBase64: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
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
    model: "gemini-3-flash-preview",
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
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const prompt = `A realistic product photo of ${productName} ${brand}, studio lighting, white background, high quality e-commerce photography.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Image generation failed");
};
export const predictStock = async (salesHistory: any[], currentStock: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const prompt = `
    Based on the following sales history and current stock levels, predict which items need restocking and suggest quantities.
    Sales History: ${JSON.stringify(salesHistory)}
    Current Stock: ${JSON.stringify(currentStock)}
    
    Return a JSON array of { productId: string, suggestedQuantity: number, reason: string }.
    Return ONLY the JSON.
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
