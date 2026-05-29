import React from "react";
import { cn } from "../../lib/utils";
import { Users, Key, Settings, MapPin, Warehouse as WarehouseIcon, LayoutDashboard, ClipboardList } from "lucide-react";

interface AdminTabsProps {
  isSuperAdmin: boolean;
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
}

export function AdminTabs({ isSuperAdmin, activeSubTab, setActiveSubTab }: AdminTabsProps) {
  const tabs = isSuperAdmin 
    ? [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "users", label: "İstifadəçilər", icon: Users },
        { id: "audit", label: "Audit Jurnalı", icon: ClipboardList },
        { id: "ai", label: "Aİ (API Keys)", icon: Key },
        { id: "settings", label: "Tətbiq Ayarları", icon: Settings },
      ]
    : [
        { id: "store_users", label: "İşçilər", icon: Users },
      ];

  return (
    <div className="flex gap-2 border-b border-zinc-200 pb-px">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveSubTab(tab.id)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all border-b-2",
            activeSubTab === tab.id
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          )}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
