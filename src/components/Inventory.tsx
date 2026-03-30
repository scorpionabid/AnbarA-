import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { Plus, Search, Edit2, Trash2, Loader2, X, AlertTriangle, History, Package, Tags, ScanLine, Camera, Upload, CheckCircle2, AlertCircle, FileText, ArrowUpRight, ArrowDownRight, Layers, Scan, Tag, Barcode, MapPin, Calendar, DollarSign, TrendingUp, Warehouse, FileDown } from "lucide-react";
import { cn } from "../lib/utils";
import { serverTimestamp, orderBy, limit, setDoc } from "firebase/firestore";
import { analyzeInvoice } from "../services/geminiService";
import { ProductModal } from "./inventory/ProductModal";
import { CategoryModal } from "./inventory/CategoryModal";

export function Inventory({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"products" | "low_stock" | "movements" | "categories">("products");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [allProductNames, setAllProductNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
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
    year: new Date().getFullYear(),
    storeId: user.storeId || "",
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    storeId: user.storeId || "",
  });

  const canManage = user.role === "super_admin" || user.role === "store_admin" || user.role === "warehouse_manager";

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchAllProductNames();
    if (activeTab === "movements") {
      fetchLogs();
    }
  }, [selectedYear, activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    let q = query(collection(db, "products"), where("year", "==", selectedYear));
    if (user.role !== "super_admin") {
      q = query(q, where("storeId", "==", user.storeId));
    }
    const snap = await getDocs(q);
    setProducts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    setLoading(false);
  };

  const fetchCategories = async () => {
    let q = query(collection(db, "categories"));
    if (user.role !== "super_admin") {
      q = query(q, where("storeId", "==", user.storeId));
    }
    const snap = await getDocs(q);
    setCategories(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };

  const fetchLogs = async () => {
    setLoading(true);
    let q = query(
      collection(db, "inventory_logs"),
      where("year", "==", selectedYear),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    if (user.role !== "super_admin") {
      q = query(q, where("storeId", "==", user.storeId));
    }
    const snap = await getDocs(q);
    setLogs(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    setLoading(false);
  };

  const logMovement = async (productId: string, productName: string, type: string, change: number, oldStock: number, newStock: number) => {
    await addDoc(collection(db, "inventory_logs"), {
      productId,
      productName,
      type,
      change,
      oldStock,
      newStock,
      userEmail: user.email,
      storeId: user.storeId,
      year: selectedYear,
      timestamp: serverTimestamp(),
    });
  };

  const fetchAllProductNames = async () => {
    // Shared product names for suggestions
    const snap = await getDocs(collection(db, "products"));
    const names = Array.from(new Set(snap.docs.map(d => d.data().name)));
    setAllProductNames(names);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } else {
      const docRef = await addDoc(collection(db, "products"), finalData);
      await logMovement(docRef.id, formData.name, "create", formData.stock, 0, formData.stock);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await updateDoc(doc(db, "categories", editingCategory.id), categoryFormData);
    } else {
      await addDoc(collection(db, "categories"), {
        ...categoryFormData,
        createdAt: serverTimestamp(),
      });
    }
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    fetchCategories();
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

  const lowStockProducts = products.filter(p => p.stock < (p.minStock ?? 10));

  if (loading && products.length === 0) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-end">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Anbar İdarəetməsi</h2>
            <p className="text-zinc-500">Məhsul siyahısı və stok vəziyyəti.</p>
          </div>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y} İli</option>)}
          </select>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {activeTab === "categories" ? (
              <button
                onClick={() => {
                  setCategoryFormData({ name: "", description: "", storeId: user.storeId || "" });
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
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
                    year: selectedYear, 
                    storeId: user.storeId || "" 
                  });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Yeni Məhsul
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("products")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "products" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <Package className="w-4 h-4" />
          Məhsullar
        </button>
        <button
          onClick={() => setActiveTab("low_stock")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "low_stock" ? "bg-white text-red-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Kritik Stok
          {lowStockProducts.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {lowStockProducts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "movements" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <History className="w-4 h-4" />
          Hərəkətlər
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "categories" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <Tags className="w-4 h-4" />
          Kateqoriyalar
        </button>
      </div>

      {activeTab === "movements" ? (
        <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:shadow-sm transition-all">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-bottom border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Tarix</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Məhsul</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Növ</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Dəyişiklik</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">İstifadəçi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {log.timestamp?.toDate().toLocaleString('az-AZ')}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{log.productName}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      log.type === "create" ? "bg-blue-100 text-blue-600" :
                      log.type === "delete" ? "bg-red-100 text-red-600" :
                      "bg-amber-100 text-amber-600"
                    )}>
                      {log.type === "create" ? "Yaradıldı" : log.type === "delete" ? "Silindi" : "Yeniləndi"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "font-bold",
                      log.change > 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {log.change > 0 ? `+${log.change}` : log.change}
                    </span>
                    <span className="text-xs text-zinc-400 ml-2">
                      ({log.oldStock} → {log.newStock})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{log.userEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === "categories" ? (
        <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:shadow-sm transition-all">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-bottom border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Ad</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Təsvir</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{c.description}</td>
                  <td className="px-6 py-4 text-right">
                    {canManage && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setCategoryFormData({ name: c.name, description: c.description, storeId: c.storeId });
                            setIsCategoryModalOpen(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("Bu kateqoriyanı silmək istədiyinizə əminsiniz?")) {
                              await deleteDoc(doc(db, "categories", c.id));
                              fetchCategories();
                            }
                          }}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && (
            <div className="p-12 text-center text-zinc-500">Kateqoriya tapılmadı.</div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:shadow-sm transition-all">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-bottom border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Məhsul</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">SKU / Barkod</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Kateqoriya</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Qiymət (Alış/Satış)</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Stok</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(activeTab === "low_stock" ? lowStockProducts : products).map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-zinc-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200">
                          <Package className="w-5 h-5 text-zinc-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-zinc-900">{p.name}</div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{p.brand || "Brendsiz"} • {p.location || "Yer yoxdur"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-500 font-mono">{p.sku}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{p.barcode || "Barkod yoxdur"}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{p.categoryName || "Kateqoriyasız"}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-zinc-900">₼{p.price}</div>
                    {p.purchasePrice > 0 && (
                      <div className="text-[10px] text-zinc-400">
                        Alış: ₼{p.purchasePrice} 
                        <span className="text-emerald-500 ml-1">
                          (+{(((p.price - p.purchasePrice) / p.purchasePrice) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      p.stock < (p.minStock ?? 10) ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {p.stock} {p.unit || "ədəd"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canManage && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setFormData(p);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("Silmək istədiyinizə əminsiniz?")) {
                              await logMovement(p.id, p.name, "delete", -p.stock, p.stock, 0);
                              await deleteDoc(doc(db, "products", p.id));
                              fetchProducts();
                            }
                          }}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(activeTab === "low_stock" ? lowStockProducts : products).length === 0 && (
            <div className="p-12 text-center text-zinc-500">Məlumat tapılmadı.</div>
          )}
        </div>
      )}

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
      />
    </div>
  );
}
