import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import Papa from "papaparse";
import { db } from "../../firebase";
import { collection, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { ImportFileSelector } from "./ImportFileSelector";
import { ImportFieldMapper } from "./ImportFieldMapper";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
  selectedYear: number;
  existingProducts: any[];
  categories: any[];
}

const REQUIRED_FIELDS = [
  { key: "name", label: "Məhsul Adı", type: "string" },
  { key: "sku", label: "SKU", type: "string" },
  { key: "price", label: "Satış Qiyməti", type: "number" },
  { key: "purchasePrice", label: "Alış Qiyməti", type: "number" },
  { key: "stock", label: "Stok", type: "number" },
];

const OPTIONAL_FIELDS = [
  { key: "categoryName", label: "Kateqoriya", type: "string" },
  { key: "barcode", label: "Barkod", type: "string" },
  { key: "brand", label: "Brend", type: "string" },
  { key: "minStock", label: "Minimum Stok", type: "number" },
  { key: "unit", label: "Ölçü Vahidi", type: "string" },
  { key: "location", label: "Anbar Yeri", type: "string" },
  { key: "description", label: "Açıqlama", type: "string" },
];

export function ImportModal({ isOpen, onClose, onSuccess, user, selectedYear, existingProducts, categories }: ImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("update");
  const [processedData, setProcessedData] = useState<{ new: any[], existing: any[] }>({ new: [], existing: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setHeaders(results.meta.fields || []);
          setCsvData(results.data);
          
          const initialMapping: Record<string, string> = {};
          const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
          
          allFields.forEach(field => {
            const match = (results.meta.fields || []).find(
              h => h.toLowerCase() === field.key.toLowerCase() || 
                   h.toLowerCase() === field.label.toLowerCase() ||
                   (field.key === "name" && h.toLowerCase() === "məhsul adı") ||
                   (field.key === "price" && h.toLowerCase() === "satış qiyməti") ||
                   (field.key === "purchasePrice" && h.toLowerCase() === "alış qiyməti") ||
                   (field.key === "stock" && h.toLowerCase() === "stok") ||
                   (field.key === "unit" && h.toLowerCase() === "ölçü vahidi")
            );
            if (match) {
              initialMapping[field.key] = match;
            }
          });
          
          setMapping(initialMapping);
          setStep(2);
        } else {
          toast.error("Fayl boşdur və ya oxuna bilmir");
        }
      },
      error: (error) => {
        toast.error(`Xəta: ${error.message}`);
      }
    });
  };

  const processImportData = () => {
    const missingRequired = REQUIRED_FIELDS.filter(f => !mapping[f.key]);
    if (missingRequired.length > 0) {
      toast.error(`Məcburi sahələr seçilməyib: ${missingRequired.map(f => f.label).join(", ")}`);
      return;
    }

    const newData: any[] = [];
    const updateData: any[] = [];

    csvData.forEach((row) => {
      const productData: any = {
        year: selectedYear,
        storeId: user.storeId || "",
        updatedAt: serverTimestamp(),
      };

      const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
      allFields.forEach(field => {
        const csvHeader = mapping[field.key];
        if (csvHeader && row[csvHeader] !== undefined) {
          let val = row[csvHeader];
          if (field.type === "number") {
            val = parseFloat(val) || 0;
          } else {
            val = String(val).trim();
          }
          productData[field.key] = val;
        }
      });

      if (productData.name) {
        // Find existing by SKU or Barcode
        const existing = existingProducts.find(p => 
          (productData.sku && p.sku === productData.sku) || 
          (productData.barcode && p.barcode === productData.barcode)
        );

        if (existing) {
          updateData.push({ ...productData, id: existing.id });
        } else {
          productData.createdAt = serverTimestamp();
          newData.push(productData);
        }
      }
    });

    setProcessedData({ new: newData, existing: updateData });
    setStep(3);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    try {
      const productsRef = collection(db, "products");
      let successCount = 0;
      let updateCount = 0;
      
      const BATCH_SIZE = 450;
      const allToProcess = [...processedData.new];
      
      if (duplicateMode === "update") {
        allToProcess.push(...processedData.existing);
      }

      if (allToProcess.length === 0) {
        toast.info("İmport ediləcək yeni məlumat yoxdur.");
        setStep(1);
        return;
      }

      // Process categories first
      const categoryMap = new Map<string, string>(); // name (lowercase) -> id
      categories.forEach(c => {
        if (c.name) categoryMap.set(c.name.toLowerCase().trim(), c.id);
      });

      const categoriesToCreate = new Map<string, string>(); // normalized name -> original name
      allToProcess.forEach(data => {
        if (data.categoryName) {
          const catNameLower = data.categoryName.toLowerCase().trim();
          if (!categoryMap.has(catNameLower) && !categoriesToCreate.has(catNameLower)) {
            categoriesToCreate.set(catNameLower, data.categoryName.trim());
          }
        }
      });

      // Create missing categories in chunks in case there's somehow more than 500
      const categoriesArray = Array.from(categoriesToCreate.entries());
      for (let i = 0; i < categoriesArray.length; i += BATCH_SIZE) {
         const catBatch = writeBatch(db);
         const chunk = categoriesArray.slice(i, i + BATCH_SIZE);
         chunk.forEach(([lowerName, originalName]) => {
           const newCatRef = doc(collection(db, "categories"));
           catBatch.set(newCatRef, {
             name: originalName,
             storeId: user.storeId || "",
             selectedYear,
             createdAt: serverTimestamp(),
           });
           categoryMap.set(lowerName, newCatRef.id);
         });
         await catBatch.commit();
      }

      for (let i = 0; i < allToProcess.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = allToProcess.slice(i, i + BATCH_SIZE);
        
        chunk.forEach(data => {
          if (data.categoryName) {
             const catNameLower = data.categoryName.toLowerCase().trim();
             const catId = categoryMap.get(catNameLower);
             if (catId) {
               data.categoryId = catId;
             }
          }

          if (data.id) {
            // Update
            const docRef = doc(db, "products", data.id);
            const { id, ...cleanData } = data;
            batch.update(docRef, cleanData);
            updateCount++;
          } else {
            // Create
            const newDocRef = doc(productsRef);
            batch.set(newDocRef, data);
            successCount++;
          }
        });
        
        await batch.commit();
      }
      
      toast.success(`${successCount} yeni məhsul əlavə edildi, ${updateCount} məhsul yeniləndi!`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("İmport zamanı xəta baş verdi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">CSV İmport</h2>
              <p className="text-sm text-zinc-500 mt-1">Məhsulları toplu şəkildə əlavə edin</p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-200 text-zinc-500 rounded-full hover:bg-zinc-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {step === 1 && (
              <ImportFileSelector onFileUpload={handleFileUpload} fileInputRef={fileInputRef} />
            )}

            {step === 2 && (
              <ImportFieldMapper 
                REQUIRED_FIELDS={REQUIRED_FIELDS}
                OPTIONAL_FIELDS={OPTIONAL_FIELDS}
                mapping={mapping}
                setMapping={setMapping}
                headers={headers}
              />
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Yeni Məhsullar</p>
                    <p className="text-3xl font-black text-emerald-900 mt-1">{processedData.new.length}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Mövcud Məhsullar</p>
                    <p className="text-3xl font-black text-amber-900 mt-1">{processedData.existing.length}</p>
                  </div>
                </div>

                {processedData.existing.length > 0 && (
                  <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-2xl">
                    <h4 className="font-bold text-zinc-900 mb-4">Mövcud məhsullarla nə edilsin?</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => setDuplicateMode("update")}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                          duplicateMode === "update" ? "border-zinc-900 bg-white" : "border-transparent bg-zinc-100"
                        )}
                      >
                        <div className="text-left">
                          <p className="font-bold text-zinc-900">Məlumatları Yenilə</p>
                          <p className="text-xs text-zinc-500 mt-0.5">CSV-dəki məlumatlarla mövcud məhsulları yeniləyir</p>
                        </div>
                        <div className={cn("w-5 h-5 rounded-full border-4", duplicateMode === "update" ? "border-zinc-900" : "border-zinc-300")} />
                      </button>
                      <button
                        onClick={() => setDuplicateMode("skip")}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                          duplicateMode === "skip" ? "border-zinc-900 bg-white" : "border-transparent bg-zinc-100"
                        )}
                      >
                        <div className="text-left">
                          <p className="font-bold text-zinc-900">Üzərindən Keç</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Mövcud məhsullara toxunmur, yalnız yeniləri əlavə edir</p>
                        </div>
                        <div className={cn("w-5 h-5 rounded-full border-4", duplicateMode === "skip" ? "border-zinc-900" : "border-zinc-300")} />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="text-center p-4">
                  <p className="text-sm text-zinc-500">
                    Cəmi <b>{processedData.new.length + (duplicateMode === "update" ? processedData.existing.length : 0)}</b> məhsul işləniləcək.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-between items-center">
            {step > 1 && (
              <button
                onClick={() => setStep(step === 2 ? 1 : 2)}
                className="px-6 py-2 text-zinc-600 font-bold hover:text-zinc-900 transition-colors"
              >
                Geri
              </button>
            )}
            <div className="flex-1" />
            {step === 2 && (
              <button
                onClick={processImportData}
                className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
              >
                İrəli
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleImport}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    İmport edilir...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    İmportu Tamamla
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
