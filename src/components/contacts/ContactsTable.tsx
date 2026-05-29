import React from "react";
import { Edit2, Trash2, Phone, Mail } from "lucide-react";
import { cn } from "../../lib/utils";

interface ContactsTableProps {
  contacts: any[];
  activeTab: "client" | "supplier";
  canManage: boolean;
  onEdit: (contact: any) => void;
  onDelete: (contact: any) => void;
}

export function ContactsTable({ contacts, activeTab, canManage, onEdit, onDelete }: ContactsTableProps) {
  return (
    <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:shadow-sm transition-all overflow-x-auto">
      <table className="w-full text-left whitespace-nowrap min-w-[800px]">
        <thead className="bg-zinc-50 border-b border-zinc-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Ad / Şirkət</th>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">VÖEN</th>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Əlaqə</th>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Ünvan</th>
            {activeTab === "client" && (
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Borc</th>
            )}
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Əməliyyat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-zinc-50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                    activeTab === "client" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-zinc-900">{contact.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-500 font-mono">
                {contact.taxId || "—"}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Phone className="w-3 h-3" />
                    {contact.phone || "—"}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Mail className="w-3 h-3" />
                    {contact.email || "—"}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-500 max-w-[200px] truncate">
                {contact.address || "—"}
              </td>
              {activeTab === "client" && (
                <td className="px-6 py-4">
                  <span className={cn(
                    "font-bold",
                    (contact.debt || 0) > 0 ? "text-red-600" : "text-emerald-600"
                  )}>
                    ₼{contact.debt || 0}
                  </span>
                </td>
              )}
              <td className="px-6 py-4 text-right">
                {canManage && (
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(contact)}
                      className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(contact)}
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
      {contacts.length === 0 && (
        <div className="p-12 text-center text-zinc-500">
          Heç bir {activeTab === "client" ? "müştəri" : "təchizatçı"} tapılmadı.
        </div>
      )}
    </div>
  );
}
