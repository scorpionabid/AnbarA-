import React from "react";
import { Plus, Users, Truck } from "lucide-react";
import { cn } from "../../lib/utils";

interface ContactsHeaderProps {
  activeTab: "client" | "supplier";
  setActiveTab: (tab: "client" | "supplier") => void;
  onAddContact: () => void;
  canManage: boolean;
}

export function ContactsHeader({ activeTab, setActiveTab, onAddContact, canManage }: ContactsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Əlaqələr</h2>
        <p className="text-zinc-500">Müştərilər və təchizatçıların idarə edilməsi.</p>
      </div>
      {canManage && (
        <button
          onClick={onAddContact}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni {activeTab === "client" ? "Müştəri" : "Təchizatçı"}
        </button>
      )}
    </div>
  );
}
