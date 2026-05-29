import React from "react";
import { X } from "lucide-react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: any;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  categories?: any[];
}

export function CategoryModal({
  isOpen,
  onClose,
  editingCategory,
  formData,
  setFormData,
  onSubmit,
  categories = []
}: CategoryModalProps) {
  if (!isOpen) return null;

  // Filter out the currently editing category and its children from potential parents (prevent circular logic later, or just filter self for now)
  const availableParents = categories.filter(c => !editingCategory || c.id !== editingCategory.id);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative mt-auto sm:my-8 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-bold mb-6">{editingCategory ? "Kateqoriyanı Redaktə Et" : "Yeni Kateqoriya"}</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Ad</label>
            <input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Ana Kateqoriya (Opsional)</label>
            <select
              value={formData.parentId || ""}
              onChange={e => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">-- Yoxdur (Əsas kateqoriya) --</option>
              {availableParents.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Təsvir</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
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
