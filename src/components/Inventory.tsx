import React, { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where, onSnapshot } from "firebase/firestore";
import { Plus, Search, Edit2, Trash2, Loader2, X, AlertTriangle, History, Package, Tags, ScanLine, Camera, Upload, CheckCircle2, AlertCircle, FileText, ArrowUpRight, ArrowDownRight, Layers, Scan, Tag, Barcode, MapPin, Calendar, DollarSign, TrendingUp, Warehouse, FileDown, MoreVertical } from "lucide-react";
import { cn, resizeImage } from "../lib/utils";
import { canAccessInventory, canManageStores } from "../lib/permissions";
import { serverTimestamp, orderBy, limit, setDoc, writeBatch } from "firebase/firestore";
import { analyzeInvoice } from "../services/geminiService";
import { InventoryStats } from "./inventory/InventoryStats";
import { InventoryTabs } from "./inventory/InventoryTabs";
import { InventoryMovements } from "./inventory/InventoryMovements";
import { InventoryCategories } from "./inventory/InventoryCategories";
import { InventoryProducts } from "./inventory/InventoryProducts";
import { ScanInvoiceModal } from "./inventory/ScanInvoiceModal";
import { ProductModal } from "./inventory/ProductModal";
import { CategoryModal } from "./inventory/CategoryModal";
import { ImportModal } from "./inventory/ImportModal";
import { BulkPriceModal } from "./inventory/BulkPriceModal";
import { toast } from "sonner";
import Papa from "papaparse";
import { ConfirmationModal } from "./ui/ConfirmationModal";

export function Inventory({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"products" | "low_stock" | "movements" | "categories">("products");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [allProductNames, setAllProductNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [logFilterType, setLogFilterType] = useState<string>("all");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "danger"
  });
  
  // OCR States
  const [isScanning, setIsScanning] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    categoryId: "",
    categoryName: "",
    price: 0,
    purchasePrice: 0,
    stock: 0,
    minStock: 10,
    unit: "ədəd",
    barcode: "",
    brand: "",
    expiryDate: "",
    location: "",
    description: "",
    imageUrl: "",
    imageUrls: [] as string[],
    year: new Date().getFullYear(),
    storeId: user.storeId || "",
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    parentId: "",
    storeId: user.storeId || "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("Hamısı");
  const [filterBrand, setFilterBrand] = useState("Hamısı");

  const canManage = useMemo(() => canAccessInventory(user, user.storeId), [user]);

  const performWebhookTrigger = async (event: string, entity: string, payload: any) => {
    const storeId = user.storeId || "default";
    const { triggerWebhook } = await import("../lib/webhook");
    await triggerWebhook(storeId, event, entity, payload);
  };

  useEffect(() => {
    if (!user) return;
    if (!canManageStores(user) && !user.storeId) {
      setLoading(false);
      return;
    }

    let productsQuery = query(collection(db, "products"), where("year", "==", selectedYear));
    if (!canManageStores(user)) {
      const storeId = user.storeId || "default";
      productsQuery = query(productsQuery, where("storeId", "==", storeId));
    }

    const unsubscribeProducts = onSnapshot(productsQuery, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).filter(p => p.status !== "passive"));
      setLoading(false);
    }, (error: any) => {
      if (error?.message?.includes("Quota") || error?.code === "resource-exhausted") {
        console.warn("Products fetch error: Quota limit exceeded.");
      } else {
        console.error("Products fetch error:", error);
        toast.error("Məhsullar yüklənərkən xəta baş verdi");
      }
      setLoading(false);
    });

    let categoriesQuery = query(collection(db, "categories"));
    if (!canManageStores(user)) {
      const storeId = user.storeId || "default";
      categoriesQuery = query(categoriesQuery, where("storeId", "==", storeId));
    }

    const unsubscribeCategories = onSnapshot(categoriesQuery, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).filter(c => c.status !== "passive"));
    }, (error: any) => {
      if (error?.message?.includes("Quota") || error?.code === "resource-exhausted") {
        console.warn("Categories fetch quota exceeded");
      } else {
        console.error("Categories fetch error:", error);
      }
    });

    let logsQuery = query(
      collection(db, "inventory_logs"),
      where("year", "==", selectedYear),
      orderBy("timestamp", "desc"),
      limit(100)
    );
    if (!canManageStores(user)) {
      const storeId = user.storeId || "default";
      logsQuery = query(logsQuery, where("storeId", "==", storeId));
    }

    const unsubscribeLogs = onSnapshot(logsQuery, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }, (error: any) => {
      if (error?.message?.includes("Quota") || error?.code === "resource-exhausted") {
        console.warn("Logs fetch quota exceeded");
      } else {
        console.error("Logs fetch error:", error);
      }
    });

    // Fetch all product names once for suggestions
    const fetchAllNames = async () => {
      try {
        let productsQuery = query(collection(db, "products"));
        if (!canManageStores(user)) {
          const storeId = user.storeId || "default";
          productsQuery = query(collection(db, "products"), where("storeId", "==", storeId));
        }
        const snap = await getDocs(productsQuery);
        const names = Array.from(new Set(snap.docs.map(d => d.data().name)));
        setAllProductNames(names);
      } catch (error) {
        console.error("Fetch all names error:", error);
      }
    };
    fetchAllNames();

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeLogs();
    };
  }, [selectedYear, user.storeId, user.role]);

  const hasSyncedCategories = useRef(false);

  useEffect(() => {
    if (products.length > 0 && categories.length >= 0 && !hasSyncedCategories.current && !loading) {
      hasSyncedCategories.current = true;
      const syncMissingCategories = async () => {
        try {
          const categoryMap = new Map<string, string>();
          categories.forEach(c => {
            if (c.name) categoryMap.set(c.name.toLowerCase().trim(), c.id);
          });

          const missingCategories = new Map<string, string>(); // lowercase -> original
          const productsToUpdate = [];

          for (const p of products) {
            if (p.categoryName && typeof p.categoryName === 'string') {
              const catLower = p.categoryName.toLowerCase().trim();
              if (!p.categoryId || p.categoryId === "") {
                if (!categoryMap.has(catLower) && !missingCategories.has(catLower)) {
                  missingCategories.set(catLower, p.categoryName.trim());
                }
                productsToUpdate.push(p);
              }
            }
          }

          if (missingCategories.size > 0 || productsToUpdate.length > 0) {
            // We must execute category creation first to get IDs, but since we rely on IDs for products...
            // Actually, we can pre-generate IDs.
            missingCategories.forEach((originalName, lowerName) => {
               const newCatRef = doc(collection(db, "categories"));
               categoryMap.set(lowerName, newCatRef.id);
            });

            const BATCH_SIZE = 450;
            const operations = [];

            // Add categories
            missingCategories.forEach((originalName, lowerName) => {
               operations.push((batch: any) => {
                  const catId = categoryMap.get(lowerName)!;
                  batch.set(doc(db, "categories", catId), {
                    name: originalName,
                    storeId: user.storeId || "",
                    createdAt: serverTimestamp(),
                  });
               });
            });

            productsToUpdate.forEach(p => {
               const catLower = p.categoryName.toLowerCase().trim();
               const newCatId = categoryMap.get(catLower);
               if (newCatId) {
                  operations.push((batch: any) => {
                     batch.update(doc(db, "products", p.id), { categoryId: newCatId });
                  });
               }
            });

            for (let i = 0; i < operations.length; i += BATCH_SIZE) {
               const batch = writeBatch(db);
               const chunk = operations.slice(i, i + BATCH_SIZE);
               chunk.forEach(op => op(batch));
               await batch.commit();
            }
            console.log(`Synced ${missingCategories.size} missing categories and updated ${productsToUpdate.length} products.`);
          }
        } catch (error) {
          console.error("Error syncing categories:", error);
        }
      };

      syncMissingCategories();
    }
  }, [products, categories, loading, user.storeId]);

  const logMovement = async (productId: string, productName: string, type: string, change: number, oldStock: number, newStock: number) => {
    try {
      await addDoc(collection(db, "inventory_logs"), {
        productId,
        productName,
        type,
        change,
        oldStock,
        newStock,
        userEmail: user.email,
        storeId: user.storeId || "default",
        year: selectedYear,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Log movement error:", error);
    }
  };

  const filteredLogs = useMemo(() => {
    if (logFilterType === "all") return logs;
    return logs.filter(log => log.type === logFilterType);
  }, [logs, logFilterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      const finalData = {
        ...formData,
        categoryName: selectedCategory ? selectedCategory.name : "",
      };

      if (editingProduct) {
        const stockChange = formData.stock - editingProduct.stock;
        await updateDoc(doc(db, "products", editingProduct.id), finalData);
        if (stockChange !== 0) {
          await logMovement(editingProduct.id, formData.name, "update", stockChange, editingProduct.stock, formData.stock);
        }
        await performWebhookTrigger("product_updated", "product", { id: editingProduct.id, ...finalData });
        toast.success("Məhsul yeniləndi");
      } else {
        const docRef = await addDoc(collection(db, "products"), finalData);
        await logMovement(docRef.id, formData.name, "create", formData.stock, 0, formData.stock);
        await performWebhookTrigger("product_created", "product", { id: docRef.id, ...finalData });
        toast.success("Yeni məhsul əlavə edildi");
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Product submit error:", error);
      toast.error("Xəta baş verdi");
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateDoc(doc(db, "categories", editingCategory.id), categoryFormData);
        await performWebhookTrigger("category_updated", "category", { id: editingCategory.id, ...categoryFormData });
        toast.success("Kateqoriya yeniləndi");
      } else {
        const docRef = await addDoc(collection(db, "categories"), {
          ...categoryFormData,
          createdAt: serverTimestamp(),
        });
        await performWebhookTrigger("category_created", "category", { id: docRef.id, ...categoryFormData });
        toast.success("Yeni kateqoriya əlavə edildi");
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error("Category submit error:", error);
      toast.error("Xəta baş verdi");
    }
  };

  const handleScanFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
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
      price: item.unitPrice * 1.2, // Default 20% margin
      stock: item.quantity,
      description: `Qaimədən əlavə edilib. Qaimə No: ${scanResult.invoiceNumber || "N/A"}`,
    });
    setIsScanning(false);
    setScanResult(null);
    setScanImage(null);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const exportData = filteredProducts.map(p => ({
      "Məhsul Adı": p.name,
      "SKU": p.sku,
      "Barkod": p.barcode || "",
      "Kateqoriya": p.categoryName || "",
      "Brend": p.brand || "",
      "Alış Qiyməti": p.purchasePrice,
      "Satış Qiyməti": p.price,
      "Mövcud Stok": p.stock,
      "Ölçü Vahidi": p.unit || "ədəd",
      "Anbar Yeri": p.location || "",
      "Minimal Stok": p.minStock || 0,
      "Açıqlama": p.description || ""
    }));

    const csv = Papa.unparse(exportData);
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anbar_siyahisi_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    
    setConfirmModal({
      isOpen: true,
      title: "Toplu Silinmə",
      message: `${selectedProductIds.length} məhsulu silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`,
      type: "danger",
      onConfirm: async () => {
        setLoading(true);
        try {
          const promises = selectedProductIds.map(async (id) => {
            const p = products.find(prod => prod.id === id);
            if (p) {
              await logMovement(id, p.name, "delete", -p.stock, p.stock, 0);
              await updateDoc(doc(db, "products", id), { status: "passive", updatedAt: serverTimestamp() });
              await performWebhookTrigger("product_deleted", "product", p);
            }
          });
          await Promise.all(promises);
          setSelectedProductIds([]);
          toast.success("Seçilmiş məhsullar uğurla silindi.");
        } catch (error) {
          console.error("Bulk delete error:", error);
          toast.error("Silinmə zamanı xəta baş verdi.");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleBulkPriceUpdate = async (type: "percentage" | "fixed", value: number, action: "increase" | "decrease") => {
    if (selectedProductIds.length === 0) return;
    
    setLoading(true);
    try {
      const promises = selectedProductIds.map(async (id) => {
        const p = products.find(prod => prod.id === id);
        if (p) {
          let newPrice = p.price;
          if (type === "percentage") {
            const change = p.price * (value / 100);
            newPrice = action === "increase" ? p.price + change : p.price - change;
          } else {
            newPrice = action === "increase" ? p.price + value : p.price - value;
          }
          
          newPrice = Math.max(0, parseFloat(newPrice.toFixed(2)));
          await updateDoc(doc(db, "products", id), { price: newPrice });
          await logMovement(id, p.name, "price_update", 0, p.stock, p.stock); // Log as price update
        }
      });
      
      await Promise.all(promises);
      setSelectedProductIds([]);
      setIsBulkPriceModalOpen(false);
      toast.success("Qiymətlər uğurla yeniləndi.");
    } catch (error) {
      console.error("Bulk price update error:", error);
      toast.error("Qiymət yeniləmə zamanı xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const lowStockProducts = products.filter(p => p.stock < (p.minStock ?? 10));

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchesCategory = false;
      if (filterCategory === "Hamısı") {
        matchesCategory = true;
      } else {
        // If filterCategory is a main category, check if product is in it or its subcategories
        const subCatIds = categories.filter(c => c.parentId === filterCategory).map(c => c.id);
        matchesCategory = p.categoryId === filterCategory || subCatIds.includes(p.categoryId);
      }

      const matchesBrand = filterBrand === "Hamısı" || p.brand === filterBrand;
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, searchQuery, filterCategory, filterBrand, categories]);

  const brands = useMemo(() => {
    return ["Hamısı", ...new Set(products.map(p => p.brand).filter(Boolean))];
  }, [products]);

  const stats = useMemo(() => {
    const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
    const totalValue = products.reduce((acc, p) => acc + (p.stock * p.purchasePrice), 0);
    const totalSaleValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
    const potentialProfit = totalSaleValue - totalValue;
    return { totalItems, totalValue, totalSaleValue, potentialProfit, lowStock: lowStockProducts.length };
  }, [products, lowStockProducts]);

  if (loading && products.length === 0) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Anbar İdarəetməsi</h2>
            <p className="text-zinc-500 text-sm">Məhsul siyahısı və stok vəziyyəti.</p>
          </div>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold shadow-sm"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y} İli</option>)}
          </select>
        </div>
        
        {canManage && (
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 flex-1 lg:flex-none overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 whitespace-nowrap bg-white border border-zinc-200 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-50 transition-all text-sm font-medium shadow-sm"
              >
                <Upload className="w-4 h-4" />
                İmport
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 whitespace-nowrap bg-white border border-zinc-200 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-50 transition-all text-sm font-medium shadow-sm"
              >
                <FileDown className="w-4 h-4" />
                Eksport
              </button>
              <button
                onClick={() => setIsScanning(true)}
                className="flex items-center gap-2 whitespace-nowrap bg-white border border-zinc-200 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-50 transition-all text-sm font-medium shadow-sm"
              >
                <Scan className="w-4 h-4" />
                Qaimə Skan
              </button>
            </div>

            {activeTab === "categories" ? (
              <button
                onClick={() => {
                  setCategoryFormData({ name: "", description: "", parentId: "", storeId: user.storeId || "" });
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all text-sm font-bold shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Yeni Kateqoriya
              </button>
            ) : (
              <button
                onClick={() => {
                  setFormData({ 
                    name: "", 
                    sku: "", 
                    categoryId: "", 
                    categoryName: "", 
                    price: 0, 
                    purchasePrice: 0,
                    stock: 0, 
                    minStock: 10,
                    unit: "ədəd",
                    barcode: "",
                    brand: "",
                    expiryDate: "",
                    location: "",
                    description: "", 
                    imageUrl: "",
                    imageUrls: [],
                    year: selectedYear, 
                    storeId: user.storeId || "" 
                  });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all text-sm font-bold shadow-md active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Yeni Məhsul
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <InventoryStats stats={stats} />

      <InventoryTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterBrand={filterBrand}
        setFilterBrand={setFilterBrand}
        categories={categories}
        brands={brands}
      />

      {activeTab === "movements" ? (
        <InventoryMovements
          logs={filteredLogs}
          logFilterType={logFilterType}
          setLogFilterType={setLogFilterType}
        />
      ) : activeTab === "categories" ? (
        <InventoryCategories
          categories={categories}
          canManage={canManage}
          onEdit={(c) => {
            setEditingCategory(c);
            setCategoryFormData({ name: c.name, description: c.description || "", parentId: c.parentId || "", storeId: c.storeId });
            setIsCategoryModalOpen(true);
          }}
          onDelete={(c) => {
            setConfirmModal({
              isOpen: true,
              title: "Kateqoriyanı Sil",
              message: `"${c.name}" kateqoriyasını silmək istədiyinizə əminsiniz?`,
              type: "danger",
              onConfirm: async () => {
                try {
                  await updateDoc(doc(db, "categories", c.id), { status: "passive", updatedAt: serverTimestamp() });
                  await performWebhookTrigger("category_deleted", "category", c);
                  toast.success("Kateqoriya silindi.");
                } catch (error) {
                  toast.error("Xəta baş verdi.");
                }
              }
            });
          }}
        />
      ) : (
        <InventoryProducts
          products={filteredProducts}
          selectedProductIds={selectedProductIds}
          toggleSelectAll={toggleSelectAll}
          toggleSelectProduct={toggleSelectProduct}
          handleBulkDelete={handleBulkDelete}
          handleBulkPriceUpdate={() => setIsBulkPriceModalOpen(true)}
          setSelectedProductIds={setSelectedProductIds}
          canManage={canManage}
          onEdit={(p) => {
            setEditingProduct(p);
            setFormData({
              ...p,
              imageUrls: p.imageUrls || (p.imageUrl ? [p.imageUrl] : [])
            });
            setIsModalOpen(true);
          }}
          onDelete={(p) => {
            setConfirmModal({
              isOpen: true,
              title: "Məhsulu Sil",
              message: `"${p.name}" məhsulunu silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`,
              type: "danger",
              onConfirm: async () => {
                try {
                  await logMovement(p.id, p.name, "delete", -p.stock, p.stock, 0);
                  await updateDoc(doc(db, "products", p.id), { status: "passive", updatedAt: serverTimestamp() });
                  await performWebhookTrigger("product_deleted", "product", p);
                  toast.success("Məhsul silindi.");
                } catch (error) {
                  toast.error("Xəta baş verdi.");
                }
              }
            });
          }}
        />
    )}

      <ScanInvoiceModal
        isScanning={isScanning}
        setIsScanning={setIsScanning}
        scanImage={scanImage}
        setScanImage={setScanImage}
        scanLoading={scanLoading}
        scanError={scanError}
        scanResult={scanResult}
        setScanResult={setScanResult}
        handleScanFileChange={handleScanFileChange}
        handleAnalyze={handleAnalyze}
        applyScanItem={applyScanItem}
      />

      <BulkPriceModal
        isOpen={isBulkPriceModalOpen}
        onClose={() => setIsBulkPriceModalOpen(false)}
        onConfirm={handleBulkPriceUpdate}
        selectedCount={selectedProductIds.length}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Modals */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        categories={categories}
        allProductNames={allProductNames}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        editingCategory={editingCategory}
        formData={categoryFormData}
        setFormData={setCategoryFormData}
        onSubmit={handleCategorySubmit}
        categories={categories}
      />
      {isImportModalOpen && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false);
          }}
          user={user}
          selectedYear={selectedYear}
          existingProducts={products}
          categories={categories}
        />
      )}
    </div>
  );
}
