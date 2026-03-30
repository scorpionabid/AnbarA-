import React from "react";
import { Users, Shield, Plus, X, UserPlus } from "lucide-react";
import { cn } from "../../lib/utils";

interface UserManagementProps {
  isSuperAdmin: boolean;
  users: any[];
  stores: any[];
  onUpdateRole: (userId: string, newRole: string) => void;
  onUpdateStore: (userId: string, storeId: string) => void;
  isUserModalOpen: boolean;
  setIsUserModalOpen: (isOpen: boolean) => void;
  newUser: any;
  setNewUser: (user: any) => void;
  onAddUser: (e: React.FormEvent) => void;
  companyName?: string;
}

export function UserManagement({
  isSuperAdmin,
  users,
  stores,
  onUpdateRole,
  onUpdateStore,
  isUserModalOpen,
  setIsUserModalOpen,
  newUser,
  setNewUser,
  onAddUser,
  companyName
}: UserManagementProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-zinc-400" />
          {isSuperAdmin ? "İstifadəçi İdarəetməsi" : "Mağaza İşçiləri"}
        </h3>
        <button
          onClick={() => setIsUserModalOpen(true)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          İşçi Əlavə Et
        </button>
      </div>
      <div className="bg-white overflow-hidden border border-zinc-100 rounded-3xl hover:shadow-sm transition-all">
        <table className="w-full text-left">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">İstifadəçi</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Email</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Rol</th>
              {isSuperAdmin && <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Mağaza</th>}
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase text-right">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-900">{u.displayName}</td>
                <td className="px-6 py-4 text-zinc-500">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    u.role === "super_admin" ? "bg-purple-100 text-purple-600" :
                    u.role === "store_admin" ? "bg-amber-100 text-amber-600" :
                    u.role === "warehouse_manager" ? "bg-blue-100 text-blue-600" :
                    u.role === "sales_agent" ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-600"
                  )}>
                    {u.role?.replace("_", " ")}
                  </span>
                </td>
                {isSuperAdmin && (
                  <td className="px-6 py-4">
                    <select
                      value={u.storeId || ""}
                      onChange={(e) => onUpdateStore(u.id, e.target.value)}
                      className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-zinc-900 w-full max-w-[150px]"
                    >
                      <option value="">Mağaza yoxdur</option>
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                )}
                <td className="px-6 py-4 text-right">
                  <select
                    value={u.role}
                    onChange={(e) => onUpdateRole(u.id, e.target.value)}
                    className="text-xs bg-zinc-100 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="customer">Müştəri</option>
                    <option value="sales_agent">Satış Agenti</option>
                    <option value="warehouse_manager">Anbar Müdiri</option>
                    {isSuperAdmin && <option value="store_admin">Mağaza Admini</option>}
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative mt-auto sm:my-8 max-h-[90vh] overflow-y-auto text-left">
            <button onClick={() => setIsUserModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <UserPlus className="w-6 h-6" />
              Yeni İstifadəçi
            </h3>
            <form onSubmit={onAddUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Ad Soyad</label>
                <input
                  required
                  value={newUser.displayName}
                  onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Email</label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase">Rol</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="customer">Müştəri</option>
                    <option value="sales_agent">Satış Agenti</option>
                    <option value="warehouse_manager">Anbar Müdiri</option>
                    <option value="store_admin">Mağaza Admini</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase">Mağaza</label>
                  {isSuperAdmin ? (
                    <select
                      value={newUser.storeId}
                      onChange={e => setNewUser({ ...newUser, storeId: e.target.value })}
                      className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="">Yoxdur</option>
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      disabled
                      value={companyName || "Sizin Mağaza"}
                      className="w-full mt-1 px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-500 cursor-not-allowed"
                    />
                  )}
                </div>
              </div>
              <button type="submit" className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors">
                Əlavə Et
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
