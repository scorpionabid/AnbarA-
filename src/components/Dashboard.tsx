import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, limit, orderBy, where } from "firebase/firestore";
import { TrendingUp, Package, AlertTriangle, ArrowUpRight, Loader2, Wallet } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsSnap, salesSnap, contactsSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(collection(db, "sales")),
          getDocs(query(collection(db, "contacts"), where("type", "==", "client")))
        ]);
        
        const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const clients = contactsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const totalRevenue = sales.reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);
        const totalDebt = clients.reduce((acc: number, c: any) => acc + (c.debt || 0), 0);

        setStats({
          totalProducts: products.length,
          lowStock: products.filter((p: any) => p.stock < 10).length,
          totalSales: sales.length,
          totalDebt,
          recentRevenue: totalRevenue,
        });

        // AI Prediction
        if (products.length > 0) {
          const aiPredictions = await predictStock(sales.slice(0, 50), products);
          setPredictions(aiPredictions);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-100 hover:shadow-sm transition-all">
            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* AI Insights Section */}
      <section className="bg-zinc-900 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">AnbarAİ Təhlili</h3>
            <p className="text-zinc-400 text-sm">Gemini 3 Flash tərəfindən hazırlanıb</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.length > 0 ? (
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
            <p className="text-zinc-500 italic">Hazırda yeni AI tövsiyəsi yoxdur.</p>
          )}
        </div>
      </section>
    </div>
  );
}
