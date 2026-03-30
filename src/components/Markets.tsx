import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, doc, updateDoc, query, where, setDoc } from "firebase/firestore";
import { Plus, Store, UserPlus, MapPin, Warehouse as WarehouseIcon, Loader2, CheckCircle, X, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export function Markets({ user }: { user: any }) {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [newStoreName, setNewStoreName] = useState("");
  
  // Store Admin specific state
  const [branches, setBranches] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [storeUsers, setStoreUsers] = useState<any[]>([]);

  const isSuperAdmin = user.role === "super_admin";
  const isStoreAdmin = user.role === "store_admin";

  useEffect(() => {
    fetchStores();
    if (isStoreAdmin) {
      fetchStoreDetails(user.storeId);
    }
  }, []);

  const fetchStores = async () => {
    const snap = await getDocs(collection(db, "stores"));
    setStores(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    setLoading(false);
  };

  const fetchStoreDetails = async (storeId: string) => {
    const bSnap = await getDocs(query(collection(db, "branches"), where("storeId", "==", storeId)));
    const wSnap = await getDocs(query(collection(db, "warehouses"), where("storeId", "==", storeId)));
    const uSnap = await getDocs(query(collection(db, "users"), where("storeId", "==", storeId)));
    
    setBranches(bSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    setWarehouses(wSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    setStoreUsers(uSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, "stores"), {
      name: newStoreName,
      createdAt: new Date().toISOString(),
      adminUids: []
    });
    setNewStoreName("");
    setIsStoreModalOpen(false);
    fetchStores();
  };

  const handleAddBranch = async (name: string, location: string) => {
    const storeId = isStoreAdmin ? user.storeId : selectedStore.id;
    await addDoc(collection(db, "branches"), { storeId, name, location });
    fetchStoreDetails(storeId);
  };

  const handleAddWarehouse = async (name: string, branchId: string) => {
    const storeId = isStoreAdmin ? user.storeId : selectedStore.id;
    await addDoc(collection(db, "warehouses"), { storeId, branchId, name });
    fetchStoreDetails(storeId);
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      const storeId = isStoreAdmin ? user.storeId : selectedStore.id;
      fetchStoreDetails(storeId);
    } catch (error) {
      console.error("Staff role update error:", error);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Mağazalar və Filiallar</h2>
          <p className="text-zinc-500 mt-1">Mağaza şəbəkəsinin idarə edilməsi.</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setIsStoreModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Mağaza
          </button>
        )}
      </header>

      {isSuperAdmin && (
        <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:shadow-sm transition-all">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Mağaza</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Yaradılıb</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stores.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer" onClick={() => {
                  setSelectedStore(s);
                  fetchStoreDetails(s.id);
                  setIsDetailModalOpen(true);
                }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
                        <Store className="w-4 h-4 text-zinc-900" />
                      </div>
                      <span className="font-medium text-zinc-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {new Date(s.createdAt).toLocaleDateString('az-AZ')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stores.length === 0 && (
            <div className="p-12 text-center text-zinc-500">Mağaza tapılmadı.</div>
          )}
        </div>
      )}

      {isStoreAdmin && (
        <div className="space-y-8">
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-100 hover:shadow-sm transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-zinc-400" />
                Filiallar
              </h3>
              <button className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors text-sm">
                <Plus className="w-4 h-4" />
                Filial Əlavə Et
              </button>
            </div>
            <div className="border border-zinc-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Filial Adı</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Məkan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {branches.map(b => (
                    <tr key={b.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-900">{b.name}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{b.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {branches.length === 0 && (
                <div className="p-12 text-center text-zinc-500">Filial tapılmadı.</div>
              )}
            </div>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-100 hover:shadow-sm transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <WarehouseIcon className="w-5 h-5 text-zinc-400" />
                Anbarlar
              </h3>
              <button className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors text-sm">
                <Plus className="w-4 h-4" />
                Anbar Əlavə Et
              </button>
            </div>
            <div className="border border-zinc-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Anbar Adı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {warehouses.map(w => (
                    <tr key={w.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-900">{w.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {warehouses.length === 0 && (
                <div className="p-12 text-center text-zinc-500">Anbar tapılmadı.</div>
              )}
            </div>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-100 hover:shadow-sm transition-all">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-zinc-400" />
              İşçilər (Staff)
            </h3>
            <div className="overflow-hidden border border-zinc-100 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase">İstifadəçi</th>
                    <th className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase">Email</th>
                    <th className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase">Rol</th>
                    <th className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase text-right">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {storeUsers.map(u => (
                    <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900">{u.displayName}</td>
                      <td className="px-4 py-3 text-sm text-zinc-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          u.role === "warehouse_manager" ? "bg-blue-100 text-blue-600" :
                          u.role === "sales_agent" ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-600"
                        )}>
                          {u.role?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          className="text-xs bg-zinc-100 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-zinc-900"
                        >
                          <option value="customer">Müştəri</option>
                          <option value="sales_agent">Satış Agenti</option>
                          <option value="warehouse_manager">Anbar Müdiri</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Store Modal */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative mt-auto sm:my-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsStoreModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold mb-6">Yeni Mağaza</h3>
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase">Mağaza Adı</label>
                <input
                  required
                  value={newStoreName}
                  onChange={e => setNewStoreName(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <button type="submit" className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors">
                Yarat
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
