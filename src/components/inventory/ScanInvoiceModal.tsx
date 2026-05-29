import React from "react";
import { X, Scan, Upload, AlertCircle, Loader2, ScanLine } from "lucide-react";

interface ScanInvoiceModalProps {
  isScanning: boolean;
  setIsScanning: (val: boolean) => void;
  scanImage: string | null;
  setScanImage: (val: string | null) => void;
  scanLoading: boolean;
  scanError: string | null;
  scanResult: any;
  setScanResult: (val: any) => void;
  handleScanFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAnalyze: () => void;
  applyScanItem: (item: any) => void;
}

export function ScanInvoiceModal({
  isScanning,
  setIsScanning,
  scanImage,
  setScanImage,
  scanLoading,
  scanError,
  scanResult,
  setScanResult,
  handleScanFileChange,
  handleAnalyze,
  applyScanItem
}: ScanInvoiceModalProps) {
  if (!isScanning) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center">
              <Scan className="w-5 h-5 text-zinc-900" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Qaimə Skaner</h3>
          </div>
          <button onClick={() => setIsScanning(false)} className="text-zinc-400 hover:text-zinc-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!scanResult ? (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-zinc-200 rounded-3xl p-12 text-center space-y-4">
              {scanImage ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-100">
                  <img src={scanImage} alt="Scan" className="w-full h-full object-contain" />
                  <button 
                    onClick={() => setScanImage(null)}
                    className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Qaimə şəklini yükləyin</p>
                    <p className="text-xs text-zinc-500 mt-1">PNG, JPG və ya PDF formatında</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleScanFileChange}
                    className="hidden" 
                    id="scan-upload" 
                  />
                  <label 
                    htmlFor="scan-upload"
                    className="bg-zinc-900 text-white px-6 py-2 rounded-xl font-bold text-sm cursor-pointer hover:bg-zinc-800 transition-all"
                  >
                    Fayl Seç
                  </label>
                </div>
              )}
            </div>

            {scanError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5" />
                {scanError}
              </div>
            )}

            <button
              disabled={!scanImage || scanLoading}
              onClick={handleAnalyze}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {scanLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ScanLine className="w-5 h-5" />
                  Analiz Et
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Qaimə Məlumatları</h4>
                  <p className="text-xs text-zinc-500">Aşağıdakı məhsullar aşkar edildi:</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-400 uppercase">Qaimə No</p>
                  <p className="text-sm font-black text-zinc-900">{scanResult.invoiceNumber || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {scanResult.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-zinc-100 group">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{item.name}</p>
                      <p className="text-[10px] text-zinc-500">{item.quantity} {item.unit} • ₼{item.unitPrice} / ədəd</p>
                    </div>
                    <button 
                      onClick={() => applyScanItem(item)}
                      className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Əlavə Et
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setScanResult(null)}
              className="w-full bg-white border border-zinc-200 text-zinc-900 py-3 rounded-2xl font-bold"
            >
              Yenidən Skan Et
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
