import React from "react";
import { Upload, Camera, Loader2, AlertCircle, CheckCircle2, ScanLine } from "lucide-react";
import { cn } from "../../lib/utils";

interface InvoiceScannerProps {
  scanImage: string | null;
  setScanImage: (img: string | null) => void;
  handleScanFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  scanLoading: boolean;
  handleAnalyze: () => void;
  scanError: string | null;
  scanResult: any;
  applyScanItem: (item: any) => void;
}

export function InvoiceScanner({
  scanImage,
  setScanImage,
  handleScanFileChange,
  scanLoading,
  handleAnalyze,
  scanError,
  scanResult,
  applyScanItem
}: InvoiceScannerProps) {
  return (
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
  );
}
