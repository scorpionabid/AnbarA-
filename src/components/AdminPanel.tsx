import React, { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, setDoc, getDoc, query, where, addDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { UserManagement } from "./admin/UserManagement";
import { StoreManagement } from "./admin/StoreManagement";
import { SystemSettings } from "./admin/SystemSettings";
import { seedDatabase } from "../lib/seedData";
import { AdminHeader } from "./admin/AdminHeader";
import { AdminTabs } from "./admin/AdminTabs";
import { SeedModal } from "./admin/SeedModal";
import { StoreDashboard } from "./admin/StoreDashboard";
import { AuditLogView } from "./admin/AuditLogView";
import { useAdminData } from "../hooks/useAdminData";
import { logAdminAction } from "../lib/audit";

export function AdminPanel({ user }: { user: any }) {
  const isSuperAdmin = user.role === "super_admin";
  const { stores, appSettings: fetchedSettings, apiKeys: fetchedKeys, loading, refreshData } = useAdminData(user);
  
  const [activeSubTab, setActiveSubTab] = useState(isSuperAdmin ? "dashboard" : "store_users");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Real-time user list
  React.useEffect(() => {
    const isSuperAdmin = user.role === "super_admin";
    if (!isSuperAdmin && !user.storeId) {
      setUsers([]);
      return;
    }

    let q = query(collection(db, "users"));
    
    if (!isSuperAdmin) {
      const storeId = user.storeId || "default";
      q = query(collection(db, "users"), where("storeId", "==", storeId));
    }
    
    const unsub = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error: any) => {
      if (error?.message?.includes("Quota limit exceeded") || error?.code === "resource-exhausted") {
        console.warn("Firestore onSnapshot error (users): Quota limit exceeded.");
      } else {
        console.error("Firestore onSnapshot error (users):", error);
      }
    });
    return () => unsub();
  }, [isSuperAdmin, user.storeId]);

  // Local state for settings form
  const [localSettings, setLocalSettings] = useState({ companyName: "AnbarAİ", vatRate: 18 });
  const [localKeys, setLocalKeys] = useState({ gemini: "" });

  // Sync fetched settings to local state
  React.useEffect(() => {
    if (fetchedSettings) setLocalSettings(fetchedSettings);
    if (fetchedKeys) setLocalKeys(fetchedKeys);
  }, [fetchedSettings, fetchedKeys]);

  const showStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      await logAdminAction(user.uid, "update_role", { userId, newRole });
      showStatus("Rol yeniləndi");
    } catch (error) {
      console.error("Role update error:", error);
    }
  };

  const handleUpdateStore = async (userId: string, storeId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { storeId: storeId || null });
      await logAdminAction(user.uid, "update_store", { userId, storeId });
      showStatus("Mağaza yeniləndi");
    } catch (error) {
      console.error("Store update error:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      await logAdminAction(user.uid, "delete_user", { userId });
      showStatus("İstifadəçi silindi");
    } catch (error: any) {
      console.error("Delete user error:", error);
      showStatus(`Xəta baş verdi: ${error.message || 'İcazəniz yoxdur'}`);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await setDoc(doc(db, "config", "settings"), { apiKeys: localKeys, appSettings: localSettings }, { merge: true });
      await logAdminAction(user.uid, "save_config", { apiKeys: "hidden", appSettings: localSettings });
      showStatus("Ayarlar yadda saxlanıldı");
    } catch (error) {
      console.error("Config save error:", error);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeedModalOpen(false);
    try {
      await seedDatabase(user.storeId || "demo-store", user.uid || "demo-user");
      await logAdminAction(user.uid, "seed_database", {});
      showStatus("Demo məlumatlar uğurla əlavə edildi");
    } catch (error) {
      console.error("Seed error:", error);
      showStatus("Xəta baş verdi");
    }
  };

  const handleGenerateApiKey = async (storeId: string) => {
    try {
      const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      await updateDoc(doc(db, "stores", storeId), { apiKey: newKey });
      await logAdminAction(user.uid, "generate_api_key", { storeId });
      showStatus("API açarı yeni yaradıldı");
      refreshData();
    } catch (error) {
      console.error("API key gen error:", error);
      showStatus("Xəta baş verdi");
    }
  };

  const handleUpdateStoreWebhook = async (storeId: string, url: string) => {
    try {
      await updateDoc(doc(db, "stores", storeId), { webhookUrl: url });
      await logAdminAction(user.uid, "update_webhook", { storeId, webhookUrl: url });
      showStatus("Webhook URL yeniləndi");
      refreshData();
    } catch (error) {
      console.error("Webhook update error:", error);
      showStatus("Xəta baş verdi");
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <AdminHeader saveStatus={saveStatus} />

      <AdminTabs 
        isSuperAdmin={isSuperAdmin}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
      />

      <div className="bg-white border border-zinc-100 rounded-3xl p-6 sm:p-8 hover:shadow-sm transition-all">
        {activeSubTab === "dashboard" && <StoreDashboard stores={stores} />}
        
        {(activeSubTab === "users" || activeSubTab === "store_users") && (
          <UserManagement
            isSuperAdmin={isSuperAdmin}
            users={users}
            stores={stores}
            onUpdateRole={handleUpdateRole}
            onUpdateStore={handleUpdateStore}
            onDeleteUser={handleDeleteUser}
            currentUserUid={user.uid}
            currentStoreId={user.storeId}
            companyName={localSettings?.companyName}
            showStatus={showStatus}
          />
        )}

        {activeSubTab === "audit" && <AuditLogView />}

        {activeSubTab === "ai" && (
          <SystemSettings
            type="ai"
            apiKeys={localKeys}
            setApiKeys={setLocalKeys}
            appSettings={localSettings}
            setAppSettings={setLocalSettings}
            onSave={handleSaveConfig}
          />
        )}

        {activeSubTab === "settings" && (
          <SystemSettings
            type="settings"
            apiKeys={localKeys}
            setApiKeys={setLocalKeys}
            appSettings={localSettings}
            setAppSettings={setLocalSettings}
            onSave={handleSaveConfig}
            onSeedDatabase={() => setIsSeedModalOpen(true)}
            stores={stores}
            onGenerateApiKey={handleGenerateApiKey}
            onUpdateStoreWebhook={handleUpdateStoreWebhook}
          />
        )}
      </div>

      <SeedModal 
        isOpen={isSeedModalOpen} 
        onClose={() => setIsSeedModalOpen(false)} 
        onConfirm={handleSeedDatabase} 
      />
    </div>
  );
}
