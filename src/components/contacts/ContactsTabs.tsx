import React from "react";
import { Users, Truck } from "lucide-react";
import { cn } from "../../lib/utils";

interface ContactsTabsProps {
  activeTab: "client" | "supplier";
  setActiveTab: (tab: "client" | "supplier") => void;
}

export function ContactsTabs({ activeTab, setActiveTab }: ContactsTabsProps) {
  return (
    <div className="flex gap-1 bg-zinc-100 p-1 rounded-2xl w-fit">
      <button
        onClick={() => setActiveTab("client")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
          activeTab === "client" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
        )}
      >
        <Users className="w-4 h-4" />
        Müştərilər
      </button>
      <button
        onClick={() => setActiveTab("supplier")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
          activeTab === "supplier" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
        )}
      >
        <Truck className="w-4 h-4" />
        Təchizatçılar
      </button>
    </div>
  );
}
