import React from "react";
import { Upload, FileDown, Info } from "lucide-react";
import Papa from "papaparse";

interface ImportFileSelectorProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function ImportFileSelector({ onFileUpload, fileInputRef }: ImportFileSelectorProps) {
  const downloadSample = () => {
    const sampleData = [
      {
        "Məhsul Adı": "Nümunə Məhsul",
        "SKU": "PRD-001",
        "Barkod": "1234567890",
        "Kateqoriya": "Elektronika",
        "Brend": "Brand X",
        "Alış Qiyməti": 100,
        "Satış Qiyməti": 150,
        "Stok": 50,
        "Ölçü Vahidi": "ədəd",
        "Anbar Yeri": "A-1"
      }
    ];
    const csv = Papa.unparse(sampleData);
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "mehsul_import_sablonu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mb-6 border border-zinc-200">
        <Upload className="w-10 h-10 text-zinc-900" />
      </div>
      <h3 className="text-xl font-bold text-zinc-900 mb-2">CSV Faylını Seçin</h3>
      <p className="text-zinc-500 mb-8 max-w-sm text-sm">
        Məhsullarınızın siyahısı olan .csv formatlı faylı yükləyin. İlk sətir başlıqları (header) ehtiva etməlidir.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-200"
        >
          Fayl Seç
        </button>
        <button
          onClick={downloadSample}
          className="flex-1 bg-white border border-zinc-200 text-zinc-900 px-8 py-4 rounded-2xl font-bold hover:bg-zinc-50 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <FileDown className="w-5 h-5" />
          Şablon Yüklə
        </button>
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-left w-full max-w-md">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900">Diqqət!</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            CSV faylınızda "Məhsul Adı", "SKU", "Satış Qiyməti", "Alış Qiyməti" və "Stok" sütunlarının olması mütləqdir. Digər sütunlar ixtiyaridir.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={onFileUpload}
      />
    </div>
  );
}
