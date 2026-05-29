import React, { useState } from "react";
import { X, ScanLine } from "lucide-react";
import { cn } from "../../lib/utils";
import { analyzeInvoice, generateProductImage } from "../../services/geminiService";
import { ProductImageManager } from "./ProductImageManager";
import { ProductBasicInfo } from "./ProductBasicInfo";
import { ProductPricingStock } from "./ProductPricingStock";
import { ProductExtraInfo } from "./ProductExtraInfo";
import { InvoiceScanner } from "./InvoiceScanner";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: any;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  categories: any[];
  allProductNames: string[];
}

export function ProductModal({
  isOpen,
  onClose,
  editingProduct,
  formData,
  setFormData,
  onSubmit,
  categories,
  allProductNames
}: ProductModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      setImageError(null);
      try {
        const { resizeImage } = await import("../../lib/utils");
        const resizedImages = await Promise.all(files.map(f => resizeImage(f)));
        const existingImages = formData.imageUrls || (formData.imageUrl ? [formData.imageUrl] : []);
        const newUrls = [...existingImages, ...resizedImages].filter((v, i, a) => a.indexOf(v) === i);
        
        setFormData({ 
          ...formData, 
          imageUrls: newUrls,
          imageUrl: newUrls[0] || "" 
        });
        setSuggestedImages([]);
      } catch (err) {
        console.error("Image resize error:", err);
        setImageError("Şəkillər yüklənərkən xəta baş verdi.");
      }
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.name) {
      setImageError("Zəhmət olmasa məhsulun adını daxil edin.");
      return;
    }
    setIsGeneratingImage(true);
    setImageError(null);
    setSuggestedImages([]);
    try {
      const images = await generateProductImage(formData.name, formData.brand || "");
      setSuggestedImages(images);
    } catch (err: any) {
      console.error(err);
      setImageError(err.message || "Şəkil tapılarkən xəta baş verdi.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleScanFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { resizeImage } = await import("../../lib/utils");
        const resizedImage = await resizeImage(file, 1200);
        setScanImage(resizedImage);
      } catch (err) {
        console.error("Scan image resize error:", err);
        setScanError("Şəkil yüklənərkən xəta baş verdi.");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!scanImage) return;
    setScanLoading(true);
    setScanError(null);
    try {
      const base64Data = scanImage.split(",")[1];
      const data = await analyzeInvoice(base64Data);
      setScanResult(data);
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || "Qaimə analizi zamanı xəta baş verdi.");
    } finally {
      setScanLoading(false);
    }
  };

  const applyScanItem = (item: any) => {
    setFormData({
      ...formData,
      name: item.name,
      purchasePrice: item.unitPrice,
      price: item.unitPrice * 1.2,
      stock: item.quantity,
      description: `Qaimədən əlavə edilib. Qaimə No: ${scanResult.invoiceNumber || "N/A"}`,
    });
    setIsScanning(false);
    setScanResult(null);
    setScanImage(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative mt-auto sm:my-8 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={() => {
            onClose();
            setIsScanning(false);
            setScanResult(null);
            setScanImage(null);
          }} 
          className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">{editingProduct ? "Məhsulu Redaktə Et" : "Yeni Məhsul Əlavə Et"}</h3>
          {!editingProduct && (
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                isScanning ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              <ScanLine className="w-4 h-4" />
              {isScanning ? "Forma Qayıt" : "Qaimə Skan Et"}
            </button>
          )}
        </div>

        {isScanning ? (
          <InvoiceScanner
            scanImage={scanImage}
            setScanImage={setScanImage}
            handleScanFileChange={handleScanFileChange}
            scanLoading={scanLoading}
            handleAnalyze={handleAnalyze}
            scanError={scanError}
            scanResult={scanResult}
            applyScanItem={applyScanItem}
          />
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProductImageManager
                formData={formData}
                setFormData={setFormData}
                handleImageFileChange={handleImageFileChange}
                handleGenerateImage={handleGenerateImage}
                isGeneratingImage={isGeneratingImage}
                imageError={imageError}
                suggestedImages={suggestedImages}
                setSuggestedImages={setSuggestedImages}
              />
              <ProductBasicInfo
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                allProductNames={allProductNames}
              />
              <ProductPricingStock
                formData={formData}
                setFormData={setFormData}
              />
              <ProductExtraInfo
                formData={formData}
                setFormData={setFormData}
              />
            </div>
            <button type="submit" className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-zinc-800 transition-all mt-4 shadow-lg shadow-zinc-200">
              {editingProduct ? "Yenilə" : "Məhsulu Əlavə Et"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
