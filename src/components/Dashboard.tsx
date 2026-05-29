import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, limit, orderBy, where, getCountFromServer, getAggregateFromServer, sum } from "firebase/firestore";
import { TrendingUp, Package, AlertTriangle, ArrowUpRight, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { predictStock } from "../services/geminiService";

export function Dashboard({ user }: { user: any }) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalSales: 0,
    totalDebt: 0,
    recentRevenue: 0,
  });
  const [predictions, setPredictions] = useState<any[]>([]);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState<{ sales: any[], products: any[] } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const storeId = user.storeId || "default";
        
        let productsCountQuery = collection(db, "products") as any;
        let lowStockQuery = query(collection(db, "products"), where("stock", "<", 10));
        let salesQuery = collection(db, "sales") as any;
        let contactsQuery = query(collection(db, "contacts"), where("type", "==", "client"));

        if (user.role !== "super_admin") {
          productsCountQuery = query(collection(db, "products"), where("storeId", "==", storeId));
          lowStockQuery = query(collection(db, "products"), where("storeId", "==", storeId), where("stock", "<", 10));
          salesQuery = query(collection(db, "sales"), where("marketId", "==", storeId));
          contactsQuery = query(collection(db, "contacts"), where("type", "==", "client"), where("storeId", "==", storeId));
        }

        const [
          productsCountSnap, 
          lowStockSnap, 
          salesCountSnap, 
          recentSalesSnap, 
          aiProductsSnap,
          debtAggregateSnap
        ] = await Promise.all([
          getCountFromServer(productsCountQuery),
          getCountFromServer(lowStockQuery),
          getCountFromServer(salesQuery),
          getDocs(query(salesQuery, orderBy("createdAt", "desc"), limit(100))),
          getDocs(query(productsCountQuery, limit(50))),
          getAggregateFromServer(contactsQuery, { totalDebt: sum("debt") })
        ]);
        
        const productsCount = productsCountSnap.data().count;
        const lowStockCount = lowStockSnap.data().count;
        const totalSalesCount = salesCountSnap.data().count;
        const totalDebt = debtAggregateSnap.data().totalDebt || 0;
        
        const recentSales = recentSalesSnap.docs.map(d => ({ id: d.id, ...(d.data() as object) }));
        const aiProducts = aiProductsSnap.docs.map(d => ({ id: d.id, ...(d.data() as object) }));

        const totalRevenue = recentSales.reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);

        setStats({
          totalProducts: productsCount,
          lowStock: lowStockCount,
          totalSales: totalSalesCount,
          totalDebt,
          recentRevenue: totalRevenue,
        });

        // Store data for manual AI analysis
        setAiData({ sales: recentSales.slice(0, 50), products: aiProducts });
      } catch (error: any) {
        if (error?.message?.includes("Quota limit exceeded") || error?.code === "resource-exhausted") {
           console.warn("Dashboard error: Quota limit exceeded.");
           toast.error("Sistem pulsuz istifadə limitini aşıb (Quota Exceeded). Bəzi məlumatlar göstərilməyə bilər.", { id: "quota-error" });
        } else {
           console.error("Dashboard error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.storeId, user.role]);

  const handleStartAiAnalysis = async () => {
    if (!aiData) return;
    setPredictionsLoading(true);
    try {
      const aiPredictions = await predictStock(aiData.sales, aiData.products);
      setPredictions(aiPredictions);
    } catch (error: any) {
      console.error("AI Prediction error:", error);
      toast.error(error.message || "Təhlil zamanı xəta baş verdi.");
    } finally {
      setPredictionsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Xoş gəldiniz, {user.displayName}</h2>
        <p className="text-zinc-500 mt-1">Bu günün statistikası və AI təhlili.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Cəmi Məhsul", value: stats.totalProducts, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Azalan Stok", value: stats.lowStock, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Cəmi Satış", value: stats.totalSales, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Cəmi Borc", value: `₼${stats.totalDebt.toFixed(2)}`, icon: Wallet, color: "text-red-600", bg: "bg-red-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-100 hover:shadow-sm transition-all min-w-0 flex flex-col items-start">
            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4 shrink-0`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="w-full">
               <p className="text-sm font-medium text-zinc-500 truncate" title={stat.label}>{stat.label}</p>
               <p className="text-2xl font-bold text-zinc-900 mt-1 truncate" title={stat.value.toString()}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights Section */}
      <section className="bg-zinc-900 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-400/10 rounded-2xl flex items-center justify-center border border-emerald-400/20">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">AnbarAİ Təhlili</h3>
              <p className="text-zinc-400 text-sm">Gemini 3 Flash tərəfindən hazırlanıb</p>
            </div>
          </div>
          
          <button
            onClick={handleStartAiAnalysis}
            disabled={predictionsLoading || !aiData}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-zinc-900 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            {predictionsLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analiz edilir...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Təhlili Başlat
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictionsLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mr-2" />
              <p className="text-zinc-400">AI təhlili aparılır...</p>
            </div>
          ) : predictions.length > 0 ? (
            predictions.map((pred, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-emerald-400 font-mono text-xs uppercase tracking-wider">Tövsiyə</span>
                  <span className="bg-emerald-400/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold">+{pred.suggestedQuantity} ədəd</span>
                </div>
                <h4 className="font-bold text-lg mb-1">{pred.productId}</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">{pred.reason}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white/5 rounded-3xl border border-white/10 border-dashed">
              <TrendingUp className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Anbar qalıqlarının AI ilə təhlil edilməsi üçün yuxarıdakı düyməni sıxın.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
