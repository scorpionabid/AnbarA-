import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, Shield, Plus, X, UserPlus, Search, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { db } from "../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { logAdminAction } from "../../lib/audit";
import { handleFirestoreError, OperationType } from "../../lib/firestoreUtils";

const userSchema = z.object({
  displayName: z.string().min(2, "Ad soyad ən az 2 simvol olmalıdır"),
  email: z.string().email("Etibarlı email daxil edin"),
  role: z.string().min(1, "Rol seçilməlidir"),
  storeId: z.string().optional(),
});

interface UserManagementProps {
  isSuperAdmin: boolean;
  users: any[];
  stores: any[];
  onUpdateRole: (userId: string, newRole: string) => void;
  onUpdateStore: (userId: string, storeId: string) => void;
  onDeleteUser: (userId: string) => void;
  showStatus: (msg: string) => void;
  currentUserUid: string;
  currentStoreId?: string;
  companyName?: string;
}

export function UserManagement({
  isSuperAdmin,
  users,
  stores,
  onUpdateRole,
  onUpdateStore,
  onDeleteUser,
  showStatus,
  currentUserUid,
  currentStoreId,
  companyName
}: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStore, setFilterStore] = useState("all");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = (u.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === "all" || u.role === filterRole;
      const matchesStore = filterStore === "all" || u.storeId === filterStore;
      return matchesSearch && matchesRole && matchesStore;
    });
  }, [users, searchQuery, filterRole, filterStore]);

  const onAddUser = async (data: any) => {
    try {
      const userEmail = data.email.toLowerCase();
      const userRef = doc(db, "users", userEmail);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        showStatus("Bu istifadəçi artıq mövcuddur!");
        return;
      }
      
      // Get the admin's storeId if not a superadmin, or use the selected storeId
      const storeId = isSuperAdmin ? data.storeId : (currentStoreId || null);
      
      await setDoc(userRef, {
        uid: userEmail,
        email: userEmail,
        displayName: data.displayName,
        role: data.role,
        storeId: storeId,
        createdAt: new Date().toISOString()
      });
      await logAdminAction(currentUserUid, "add_user", { email: userEmail });
      showStatus("İstifadəçi əlavə edildi");
      setIsUserModalOpen(false);
      reset();
    } catch (error) {
      console.error("Add user error:", error);
      handleFirestoreError(error, OperationType.WRITE, "users/" + data.email.toLowerCase());
      showStatus("İstifadəçi əlavə edilərkən xəta baş verdi");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-zinc-400" />
          {isSuperAdmin ? "İstifadəçi İdarəetməsi" : "Mağaza İşçiləri"}
        </h3>
        <button
          onClick={() => setIsUserModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          İşçi Əlavə Et
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Ad və ya email ilə axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="all">Bütün Rollar</option>
          <option value="sales_agent">Satış Agenti</option>
          <option value="warehouse_manager">Anbar Müdiri</option>
          {isSuperAdmin && <option value="store_admin">Mağaza Admini</option>}
          {isSuperAdmin && <option value="super_admin">Super Admin</option>}
        </select>
        {isSuperAdmin && (
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="all">Bütün Mağazalar</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white overflow-hidden border border-zinc-100 rounded-3xl hover:shadow-sm transition-all overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 5 : 4} className="px-6 py-8 text-center text-zinc-500">
                  İstifadəçi tapılmadı
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
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
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => onUpdateRole(u.id, e.target.value)}
                      className="text-xs bg-zinc-100 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="sales_agent">Satış Agenti</option>
                      <option value="warehouse_manager">Anbar Müdiri</option>
                      {isSuperAdmin && <option value="store_admin">Mağaza Admini</option>}
                      {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                    </select>
                    <button
                      onClick={() => onDeleteUser(u.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="İstifadəçini sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

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
            <form onSubmit={handleSubmit(onAddUser)} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Ad Soyad</label>
                <input
                  {...register("displayName")}
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                {errors.displayName && <p className="text-red-500 text-xs mt-1">{errors.displayName.message as string}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Email</label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase">Rol</label>
                  <select
                    {...register("role")}
                    className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="sales_agent">Satış Agenti</option>
                    <option value="warehouse_manager">Anbar Müdiri</option>
                    {isSuperAdmin && <option value="store_admin">Mağaza Admini</option>}
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                  {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message as string}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase">Mağaza</label>
                  {isSuperAdmin ? (
                    <select
                      {...register("storeId")}
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
