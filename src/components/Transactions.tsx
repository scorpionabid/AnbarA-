import { useState } from "react";
import { Sales } from "./Sales";
import { Purchases } from "./Purchases";
import { TransactionHistory } from "./transactions/TransactionHistory";
import { TransactionEditLogs } from "./transactions/TransactionEditLogs";
import { ShoppingCart, ArrowDownToLine, ShoppingBag, LayoutDashboard, History, FileClock } from "lucide-react";
import { cn } from "../lib/utils";

export function Transactions({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"sales" | "purchases" | "history" | "logs">("sales");

  return (
    <div className="space-y-6">
      <div className="flex justify-start items-center">
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-2xl w-fit overflow-x-auto">
          <button
            onClick={() => setActiveTab("sales")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "sales" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            Satış
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "purchases" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <ArrowDownToLine className="w-4 h-4" />
            Alış
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "history" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <History className="w-4 h-4" />
            Tarixçə
          </button>
          {['super_admin', 'store_admin'].includes(user.role) && (
            <button
              onClick={() => setActiveTab("logs")}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                activeTab === "logs" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <FileClock className="w-4 h-4" />
              Dəyişiklik Loqları
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "sales" ? (
          <Sales user={user} />
        ) : activeTab === "purchases" ? (
          <Purchases user={user} />
        ) : activeTab === "history" ? (
          <TransactionHistory user={user} />
        ) : (
          <TransactionEditLogs user={user} />
        )}
      </div>
    </div>
  );
}
