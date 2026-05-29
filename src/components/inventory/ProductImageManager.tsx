import React, { useState } from "react";
import { Upload, ImageIcon, Sparkles, Loader2, AlertCircle, X, Check, Star } from "lucide-react";
import { cn } from "../../lib/utils";

interface ProductImageManagerProps {
  formData: any;
  setFormData: (data: any) => void;
  handleImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerateImage: () => void;
  isGeneratingImage: boolean;
  imageError: string | null;
  suggestedImages: string[];
  setSuggestedImages: (imgs: string[]) => void;
}

export function ProductImageManager({
  formData,
  setFormData,
  handleImageFileChange,
  handleGenerateImage,
  isGeneratingImage,
  imageError,
  suggestedImages,
  setSuggestedImages
}: ProductImageManagerProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  const toggleSuggestion = (url: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const addSelectedImages = () => {
    const existingImages = formData.imageUrls || (formData.imageUrl ? [formData.imageUrl] : []);
    const newUrls = [...existingImages, ...selectedSuggestions].filter((v, i, a) => a.indexOf(v) === i);
    setFormData({ 
      ...formData, 
      imageUrls: newUrls,
      imageUrl: newUrls[0] || ""
    });
    setSuggestedImages([]);
    setSelectedSuggestions([]);
  };

  const setAsMain = (url: string) => {
    const existingImages = formData.imageUrls || (formData.imageUrl ? [formData.imageUrl] : []);
    const filtered = existingImages.filter(u => u !== url);
    const newUrls = [url, ...filtered];
    setFormData({
      ...formData,
      imageUrls: newUrls,
      imageUrl: url
    });
  };

  const removeImage = (idx: number) => {
    const existingImages = formData.imageUrls || (formData.imageUrl ? [formData.imageUrl] : []);
    const newUrls = [...existingImages];
    newUrls.splice(idx, 1);
    setFormData({ 
      ...formData, 
      imageUrls: newUrls,
      imageUrl: newUrls[0] || ""
    });
  };

  const currentImages = formData.imageUrls || (formData.imageUrl ? [formData.imageUrl] : []);

  return (
    <div className="col-span-2">
      <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        Məhsul Şəkilləri
      </h4>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-48 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-zinc-400 transition-all">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-xs font-bold text-zinc-900 px-2">Cihazdan yüklə</p>
            <p className="text-[10px] text-zinc-500 mt-1 px-4">Bir neçə şəkil seçə bilərsiniz</p>
          </div>

          <div className="h-48 bg-zinc-50 border border-zinc-200 rounded-3xl p-6 flex flex-col justify-center gap-3 relative overflow-hidden">
            <div className="relative z-10">
              <h5 className="font-bold text-zinc-900 text-sm">Aİ ilə Şəkil Tap</h5>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">Məhsulun adı və brendindən istifadə edərək süni intellekt vasitəsilə yüksək keyfiyyətli şəkillər tapın.</p>
              <button
                type="button"
                disabled={isGeneratingImage || !formData.name}
                onClick={handleGenerateImage}
                className="mt-4 flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 px-6 rounded-2xl font-bold text-xs disabled:opacity-50 hover:bg-zinc-800 transition-all active:scale-95"
              >
                {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGeneratingImage ? "Axtarılır..." : "Şəkilləri Tap"}
              </button>
            </div>
            <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-zinc-100 -rotate-12 pointer-events-none" />
          </div>
        </div>

        {suggestedImages.length > 0 && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h5 className="font-bold text-blue-900 text-sm">Təklif edilən şəkillər</h5>
                <p className="text-[10px] text-blue-600 mt-0.5">Əlavə etmək istədiklərinizi seçin</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSuggestedImages([])}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  type="button"
                  disabled={selectedSuggestions.length === 0}
                  onClick={addSelectedImages}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
                >
                  Seçilənləri əlavə et ({selectedSuggestions.length})
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {suggestedImages.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleSuggestion(url)}
                  className={cn(
                    "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group",
                    selectedSuggestions.includes(url) ? "border-blue-600 ring-2 ring-blue-100" : "border-transparent hover:border-blue-200"
                  )}
                >
                  <img src={url} alt={`Suggested ${idx}`} className="w-full h-full object-cover" />
                  <div className={cn(
                    "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                    selectedSuggestions.includes(url) ? "bg-blue-600 text-white" : "bg-white/80 text-zinc-400 group-hover:text-blue-600"
                  )}>
                    {selectedSuggestions.includes(url) ? <Check className="w-4 h-4" /> : <div className="w-3 h-3 rounded-full border-2 border-current" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {imageError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {imageError}
          </div>
        )}

        {/* Current Image Gallery */}
        {currentImages.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Seçilmiş Şəkillər</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {currentImages.map((url: string, idx: number) => (
                <div key={idx} className={cn(
                  "relative group aspect-square rounded-3xl overflow-hidden border transition-all",
                  idx === 0 ? "border-zinc-900 border-2" : "border-zinc-200"
                )}>
                  <img src={url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                  
                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => setAsMain(url)}
                        className="bg-white text-zinc-900 w-full py-1.5 rounded-xl text-[10px] font-bold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Star className="w-3 h-3 fill-current" />
                        Əsas et
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="bg-red-500 text-white w-full py-1.5 rounded-xl text-[10px] font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3 h-3" />
                      Sil
                    </button>
                  </div>

                  {idx === 0 && (
                    <div className="absolute top-3 left-3 bg-zinc-900 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                      Əsas
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
