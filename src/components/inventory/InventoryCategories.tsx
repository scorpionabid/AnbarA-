import React from "react";
import { Edit2, Trash2 } from "lucide-react";

interface InventoryCategoriesProps {
  categories: any[];
  canManage: boolean;
  onEdit: (category: any) => void;
  onDelete: (category: any) => void;
}

export function InventoryCategories({ categories, canManage, onEdit, onDelete }: InventoryCategoriesProps) {
  const mainCategories = categories.filter(c => !c.parentId);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parentId === parentId);

  return (
    <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:shadow-sm transition-all">
      <table className="w-full text-left">
        <thead className="bg-zinc-50 border-bottom border-zinc-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Ad</th>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Təsvir</th>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Əməliyyat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {mainCategories.map((c) => (
            <React.Fragment key={c.id}>
              <tr className="hover:bg-zinc-50 transition-colors bg-zinc-50/50">
                <td className="px-6 py-4 font-bold text-zinc-900">{c.name}</td>
                <td className="px-6 py-4 text-sm text-zinc-500">{c.description}</td>
                <td className="px-6 py-4 text-right">
                  {canManage && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(c)}
                        className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
              {getSubcategories(c.id).map(sub => (
                <tr key={sub.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-700 pl-12 border-l-2 border-transparent">
                    <span className="text-zinc-400 mr-2">↳</span>
                    {sub.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{sub.description}</td>
                  <td className="px-6 py-4 text-right">
                    {canManage && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onEdit(sub)}
                          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(sub)}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {categories.length === 0 && (
        <div className="p-12 text-center text-zinc-500">Kateqoriya tapılmadı.</div>
      )}
    </div>
  );
}
