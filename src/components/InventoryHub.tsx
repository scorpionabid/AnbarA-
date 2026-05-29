import React, { useState, useEffect } from "react";
import { Inventory } from "./Inventory";
import { Returns } from "./Returns";
import { WriteOffs } from "./WriteOffs";
import { Box, RotateCcw, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";

export function InventoryHub({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "inventory";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", activeTab);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [activeTab]);

  const tabs = [
    { id: "inventory", label: "Anbar", icon: Box },
    { id: "returns", label: "Qaytarılmalar", icon: RotateCcw },
    { id: "write_offs", label: "Silinmələr", icon: AlertTriangle },
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
        {activeTab === "inventory" && <Inventory user={user} />}
        {activeTab === "returns" && <Returns user={user} />}
        {activeTab === "write_offs" && <WriteOffs user={user} />}
      </div>
    </div>
  );
}
