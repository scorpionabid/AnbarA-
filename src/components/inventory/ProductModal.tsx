import React, { useState } from "react";
import { X, ScanLine, Upload, Camera, Loader2, AlertCircle, CheckCircle2, Package, Tags, FileText, Image as ImageIcon, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { analyzeInvoice, generateProductImage } from "../../services/geminiService";

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
  const [suggestedImage, setSuggestedImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) { // 800KB limit
        setImageError("Şəkil ölçüsü çox böyükdür. Maksimum 800KB olmalıdır.");
        return;
      }
      setImageError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
        setSuggestedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.name) {
      setImageError("Zəhmət olmasa məhsulun adını daxil edin.");
      return;
    }
    setIsGeneratingImage(true);
    setImageError(null);
    setSuggestedImage(null);
    try {
      const imageUrl = await generateProductImage(formData.name, formData.brand || "");
      setSuggestedImage(imageUrl);
    } catch (err) {
      console.error(err);
      setImageError("Şəkil tapılarkən xəta baş verdi.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleScanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScanImage(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    } catch (err) {
      console.error(err);
      setScanError("Qaimə analizi zamanı xəta baş verdi.");
    } finally {
      setScanLoading(false);
    }
  };

  const applyScanItem = (item: any) => {
    setFormData({
      ...formData,
      name: item.name,
      purchasePrice: item.unitPrice,
      price: item.unitPrice * 1.2, // Default 20% margin
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
          <div className="space-y-6">
            <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative hover:border-zinc-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleScanFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {scanImage ? (
                <img src={scanImage} alt="Preview" className="max-h-48 rounded-lg shadow-sm" />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-zinc-300 mb-2" />
                  <p className="text-sm font-bold text-zinc-900">Qaimə şəklini seçin</p>
                  <p className="text-xs text-zinc-400">və ya bura sürükləyin</p>
                </>
              )}
            </div>

            <button
              disabled={!scanImage || scanLoading}
              onClick={handleAnalyze}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-zinc-800 transition-colors"
            >
              {scanLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {scanLoading ? "Analiz edilir..." : "AI ilə Analiz Et"}
            </button>

            {scanError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {scanError}
              </div>
            )}

            {scanResult && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Analiz Tamamlandı (No: {scanResult.invoiceNumber || "N/A"})
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {scanResult.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{item.name}</p>
                        <p className="text-xs text-zinc-400">{item.quantity} ədəd x ₼{item.unitPrice}</p>
                      </div>
                      <button
                        onClick={() => applyScanItem(item)}
                        className="bg-white border border-zinc-200 text-zinc-900 px-3 py-1 rounded-lg text-xs font-bold hover:bg-zinc-50 transition-colors"
                      >
                        Seç
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Məhsul Şəkli
                </h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-48 h-48 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-zinc-400 transition-colors shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Product" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <p className="text-white text-xs font-bold">Dəyişdir</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-zinc-300 mb-2" />
                        <p className="text-xs font-bold text-zinc-900 px-2">Kompüterdən yüklə</p>
                      </>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center space-y-3 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                    <div>
                      <h5 className="font-bold text-zinc-900 text-sm">AI ilə Şəkil Tap</h5>
                      <p className="text-xs text-zinc-500 mt-1">Məhsulun adı və brendinə uyğun şəkli internetdən tapıb yükləyin.</p>
                    </div>
                    
                    {suggestedImage ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={suggestedImage} alt="Suggested" className="w-16 h-16 object-cover rounded-xl border border-zinc-200" />
                          <div className="flex flex-col gap-2">
                            <p className="text-xs font-bold text-zinc-700">Təklif edilən şəkil</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, imageUrl: suggestedImage });
                                  setSuggestedImage(null);
                                }}
                                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              >
                                Qəbul et
                              </button>
                              <button
                                type="button"
                                onClick={() => setSuggestedImage(null)}
                                className="bg-zinc-200 text-zinc-700 hover:bg-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              >
                                İmtina
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isGeneratingImage || !formData.name}
                        onClick={handleGenerateImage}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 px-4 rounded-xl font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity w-fit"
                      >
                        {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isGeneratingImage ? "Axtarılır..." : "AI ilə Tap"}
                      </button>
                    )}

                    {imageError && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {imageError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Əsas Məlumatlar
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Məhsulun Adı</label>
                    <input
                      required
                      list="product-names"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                    <datalist id="product-names">
                      {allProductNames.map(name => <option key={name} value={name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">SKU / Kod</label>
                    <input
                      required
                      value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">Barkod</label>
                    <input
                      value={formData.barcode}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">Kateqoriya</label>
                    <select
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="">Seçin</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">Brend</label>
                    <input
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <Tags className="w-4 h-4" />
                  Qiymət və Stok
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">Alış Qiyməti (₼)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">Satış Qiyməti (₼)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">Ölçü Vahidi</label>
                    <select
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      {["ədəd", "kq", "litr", "metr", "paçka", "qutu"].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">Mövcud Stok</label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">Kritik Hədd</label>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">İl</label>
                    <input
                      type="number"
                      required
                      value={formData.year}
                      onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Əlavə Məlumatlar
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">Son İstifadə Tarixi</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">Anbardakı Yeri</label>
                    <input
                      placeholder="Məs: Rəf A-1"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Təsvir</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
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
