import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, where, limit } from "firebase/firestore";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Download,
  ChevronDown
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { cn } from "../lib/utils";
import { StatsGrid } from "./reports/StatsGrid";
import { RevenueChart } from "./reports/RevenueChart";
import { CategoryChart } from "./reports/CategoryChart";
import { TopProductsTable } from "./reports/TopProductsTable";

interface Sale {
  id: string;
  totalAmount: number;
  items: any[];
  createdAt: any;
  paymentMethod: string;
}

export function Reports({ user }: { user: any }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
      } catch (error) {
        console.error("Hesabatlar yüklənərkən xəta:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalCost = sales.reduce((acc, sale) => {
      const saleCost = sale.items.reduce((itemAcc, item) => itemAcc + (item.purchasePrice * item.quantity), 0);
      return acc + saleCost;
    }, 0);
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const totalOrders = sales.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const onlineSales = sales.filter(s => s.channel === 'online').reduce((acc, sale) => acc + sale.totalAmount, 0);
    const offlineSales = sales.filter(s => s.channel === 'offline').reduce((acc, sale) => acc + sale.totalAmount, 0);

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      totalOrders,
      avgOrderValue,
      onlineSales,
      offlineSales
    };
  }, [sales]);

  const chartData = useMemo(() => {
    const data: any[] = [];
    const grouped = sales.reduce((acc: any, sale) => {
      const date = sale.createdAt?.toDate().toLocaleDateString('az-AZ', { day: '2-digit', month: 'short' });
      if (!date) return acc;
      if (!acc[date]) acc[date] = { date, revenue: 0, profit: 0, count: 0 };
      acc[date].revenue += sale.totalAmount;
      const saleCost = sale.items.reduce((itemAcc, item) => itemAcc + (item.purchasePrice * item.quantity), 0);
      acc[date].profit += (sale.totalAmount - saleCost);
      acc[date].count += 1;
      return acc;
    }, {});

    return Object.values(grouped).reverse();
  }, [sales]);

  const categoryData = useMemo(() => {
    const grouped = sales.reduce((acc: any, sale) => {
      sale.items.forEach(item => {
        const cat = item.category || "Digər";
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += item.price * item.quantity;
      });
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-zinc-900" />
      <p className="text-zinc-500 font-medium">Hesabatlar hazırlanır...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Hesabatlar və Analitika</h2>
          <p className="text-zinc-500 mt-1">Mağazanın maliyyə və satış göstəriciləri.</p>
        </div>
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-xl">
          {(["7d", "30d", "all"] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                timeRange === range ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {range === "7d" ? "7 Gün" : range === "30d" ? "30 Gün" : "Hamısı"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <RevenueChart data={chartData} />
        <CategoryChart data={categoryData} colors={COLORS} />
      </div>

      {/* Bottom Section: Top Products */}
      <TopProductsTable sales={sales} />
    </div>
  );
}
