import React from "react";
import { X } from "lucide-react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  editingContact: any;
  activeTab: "client" | "supplier";
}

export function ContactModal({ isOpen, onClose, onSubmit, formData, setFormData, editingContact, activeTab }: ContactModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative mt-auto sm:my-8 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-bold mb-6">
          {editingContact ? "Redaktə Et" : `Yeni ${activeTab === "client" ? "Müştəri" : "Təchizatçı"}`}
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Ad / Şirkət Adı</label>
            <input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase">VÖEN</label>
              <input
                value={formData.taxId}
                onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase">Telefon</label>
              <input
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Ünvan</label>
            <textarea
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <button type="submit" className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors mt-4">
            Yadda Saxla
          </button>
        </form>
      </div>
    </div>
  );
}
