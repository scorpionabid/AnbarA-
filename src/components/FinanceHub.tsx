import React, { useState } from "react";
import { Cashboxes } from "./Cashboxes";
import { Debts } from "./Debts";
import { SupplierPayments } from "./SupplierPayments";
import { Expenses } from "./Expenses";
import { Landmark, Wallet, Truck, Receipt } from "lucide-react";
import { cn } from "../lib/utils";

export function FinanceHub({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("cashboxes");

  const tabs = [
    { id: "cashboxes", label: "Kassalar", icon: Landmark },
    { id: "debts", label: "Müştəri Nisyələri", icon: Wallet },
    { id: "supplier_payments", label: "Təchizatçı Ödənişləri", icon: Truck },
    { id: "expenses", label: "Xərclər", icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-zinc-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all",
              activeTab === tab.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "cashboxes" && <Cashboxes user={user} />}
        {activeTab === "debts" && <Debts user={user} />}
        {activeTab === "supplier_payments" && <SupplierPayments user={user} />}
        {activeTab === "expenses" && <Expenses user={user} />}
      </div>
    </div>
  );
}
