import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, setDoc, getDoc, query, where, addDoc } from "firebase/firestore";
import { 
  Users, 
  Key, 
  Settings, 
  MapPin, 
  Warehouse as WarehouseIcon,
  Loader2,
  CheckCircle
} from "lucide-react";
import { cn } from "../lib/utils";
import { UserManagement } from "./admin/UserManagement";
import { StoreManagement } from "./admin/StoreManagement";
import { SystemSettings } from "./admin/SystemSettings";
import { seedDatabase } from "../lib/seedData";

export function AdminPanel({ user }: { user: any }) {
  const isSuperAdmin = user.role === "super_admin";
  const isStoreAdmin = user.role === "store_admin";
  
  const [activeSubTab, setActiveSubTab] = useState(isSuperAdmin ? "users" : "store_users");
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState({ gemini: "" });
  const [appSettings, setAppSettings] = useState({ companyName: "AnbarAİ", vatRate: 18 });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", displayName: "", role: "customer", storeId: isStoreAdmin ? user.storeId : "" });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Users
        let usersSnap;
        if (isSuperAdmin) {
          usersSnap = await getDocs(collection(db, "users"));
        } else {
          usersSnap = await getDocs(query(collection(db, "users"), where("storeId", "==", user.storeId)));
        }
        setUsers(usersSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

        if (isSuperAdmin) {
          // Fetch Stores
          const storesSnap = await getDocs(collection(db, "stores"));
          setStores(storesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

          // Fetch Config (API Keys & Settings)
          const configDoc = await getDoc(doc(db, "config", "settings"));
          if (configDoc.exists()) {
            const data = configDoc.data();
            setApiKeys(data.apiKeys || { gemini: "" });
            setAppSettings(data.appSettings || { companyName: "AnbarAİ", vatRate: 18 });
          }
        } else {
          // Fetch Store Specific Data (Branches, Warehouses)
          const bSnap = await getDocs(query(collection(db, "branches"), where("storeId", "==", user.storeId)));
          const wSnap = await getDocs(query(collection(db, "warehouses"), where("storeId", "==", user.storeId)));
          setBranches(bSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
          setWarehouses(wSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        }
      } catch (error) {
        console.error("Admin fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.storeId, isSuperAdmin]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showStatus("Rol yeniləndi");
    } catch (error) {
      console.error("Role update error:", error);
    }
  };

  const handleUpdateStore = async (userId: string, storeId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { storeId: storeId || null });
      setUsers(users.map(u => u.id === userId ? { ...u, storeId: storeId || null } : u));
      showStatus("Mağaza yeniləndi");
    } catch (error) {
      console.error("Store update error:", error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await setDoc(doc(db, "config", "settings"), { apiKeys, appSettings }, { merge: true });
      showStatus("Ayarlar yadda saxlanıldı");
    } catch (error) {
      console.error("Config save error:", error);
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm("Bütün cədvəllərə demo məlumatlar əlavə ediləcək. Davam etmək istəyirsiniz?")) return;
    
    try {
      setLoading(true);
      await seedDatabase(user.storeId || "demo-store", user.id || "demo-user");
      showStatus("Demo məlumatlar uğurla əlavə edildi");
    } catch (error) {
      console.error("Seed error:", error);
      showStatus("Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Since we can't create Auth users from client, we add to 'users' collection.
      // The user will need to sign up with this email to 'claim' the role.
      // We use email as a temporary ID if we want, or just addDoc.
      // Better to use email as ID to prevent duplicates if they sign up later.
      const userRef = doc(db, "users", newUser.email.toLowerCase());
      await setDoc(userRef, {
        email: newUser.email.toLowerCase(),
        displayName: newUser.displayName,
        role: newUser.role,
        storeId: newUser.storeId || null,
        createdAt: new Date().toISOString()
      });
      
      setUsers([...users, { id: newUser.email.toLowerCase(), ...newUser }]);
      setIsUserModalOpen(false);
      setNewUser({ email: "", displayName: "", role: "customer", storeId: "" });
      showStatus("İstifadəçi əlavə edildi");
    } catch (error) {
      console.error("Add user error:", error);
    }
  };

  const showStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Admin Paneli</h2>
          <p className="text-zinc-500 mt-1">Sistem idarəetməsi və konfiqurasiya.</p>
        </div>
        {saveStatus && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-bold">{saveStatus}</span>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-px">
        {isSuperAdmin ? (
          [
            { id: "users", label: "İstifadəçilər", icon: Users },
            { id: "ai", label: "Aİ (API Keys)", icon: Key },
            { id: "settings", label: "Tətbiq Ayarları", icon: Settings },
          ].map((tab) => (
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
          ))
        ) : (
          [
            { id: "store_users", label: "İşçilər", icon: Users },
            { id: "branches", label: "Filiallar", icon: MapPin },
            { id: "warehouses", label: "Anbarlar", icon: WarehouseIcon },
          ].map((tab) => (
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
          ))
        )}
      </div>

      {/* Content */}
      <div className="bg-white border border-zinc-100 rounded-3xl p-6 sm:p-8 hover:shadow-sm transition-all">
        {(activeSubTab === "users" || activeSubTab === "store_users") && (
          <UserManagement
            isSuperAdmin={isSuperAdmin}
            users={users}
            stores={stores}
            onUpdateRole={handleUpdateRole}
            onUpdateStore={handleUpdateStore}
            isUserModalOpen={isUserModalOpen}
            setIsUserModalOpen={setIsUserModalOpen}
            newUser={newUser}
            setNewUser={setNewUser}
            onAddUser={handleAddUser}
            companyName={appSettings.companyName}
          />
        )}

        {activeSubTab === "branches" && (
          <StoreManagement type="branches" data={branches} />
        )}

        {activeSubTab === "warehouses" && (
          <StoreManagement type="warehouses" data={warehouses} />
        )}

        {activeSubTab === "ai" && (
          <SystemSettings
            type="ai"
            apiKeys={apiKeys}
            setApiKeys={setApiKeys}
            appSettings={appSettings}
            setAppSettings={setAppSettings}
            onSave={handleSaveConfig}
          />
        )}

        {activeSubTab === "settings" && (
          <SystemSettings
            type="settings"
            apiKeys={apiKeys}
            setApiKeys={setApiKeys}
            appSettings={appSettings}
            setAppSettings={setAppSettings}
            onSave={handleSaveConfig}
            onSeedDatabase={handleSeedDatabase}
          />
        )}
      </div>
    </div>
  );
}
