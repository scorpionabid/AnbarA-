import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { canManageContacts } from "../lib/permissions";
import { toast } from "sonner";
import { ConfirmationModal } from "./ui/ConfirmationModal";
import { ContactsHeader } from "./contacts/ContactsHeader";
import { ContactsTabs } from "./contacts/ContactsTabs";
import { ContactsTable } from "./contacts/ContactsTable";
import { ContactModal } from "./contacts/ContactModal";

export function Contacts({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"client" | "supplier">("client");
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    type: "client" as "client" | "supplier",
    storeId: user.storeId || "",
  });

  const canManage = canManageContacts(user, user.storeId);

  useEffect(() => {
    fetchContacts();
  }, [activeTab]);

  const fetchContacts = async () => {
    if (user.role !== "super_admin" && !user.storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let q = query(collection(db, "contacts"), where("type", "==", activeTab), limit(500));
      if (user.role !== "super_admin") {
        const storeId = user.storeId || "default";
        q = query(collection(db, "contacts"), where("type", "==", activeTab), where("storeId", "==", storeId), limit(500));
      }
      const snap = await getDocs(q);
      setContacts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    } catch (error) {
      console.error("Fetch contacts error:", error);
      toast.error("Məlumatlar yüklənərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await updateDoc(doc(db, "contacts", editingContact.id), formData);
        toast.success("Məlumatlar yeniləndi");
      } else {
        await addDoc(collection(db, "contacts"), {
          ...formData,
          type: activeTab,
          createdAt: serverTimestamp(),
        });
        toast.success("Yeni əlaqə əlavə edildi");
      }
      setIsModalOpen(false);
      setEditingContact(null);
      fetchContacts();
    } catch (error) {
      console.error("Contact submit error:", error);
      toast.error("Xəta baş verdi");
    }
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;
    try {
      await deleteDoc(doc(db, "contacts", contactToDelete.id));
      toast.success("Əlaqə silindi");
      fetchContacts();
    } catch (error) {
      console.error("Delete contact error:", error);
      toast.error("Silinmə zamanı xəta baş verdi");
    } finally {
      setIsDeleteModalOpen(false);
      setContactToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <ContactsHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddContact={() => {
          setFormData({ name: "", email: "", phone: "", address: "", taxId: "", type: activeTab, storeId: user.storeId || "" });
          setEditingContact(null);
          setIsModalOpen(true);
        }}
        canManage={canManage}
      />

      <ContactsTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-zinc-400" /></div>
      ) : (
        <ContactsTable 
          contacts={contacts}
          activeTab={activeTab}
          canManage={canManage}
          onEdit={(contact) => {
            setEditingContact(contact);
            setFormData(contact);
            setIsModalOpen(true);
          }}
          onDelete={(contact) => {
            setContactToDelete(contact);
            setIsDeleteModalOpen(true);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Əlaqəni Sil"
        message={`${contactToDelete?.name} adlı əlaqəni silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`}
        confirmText="Sil"
        cancelText="Ləğv et"
        type="danger"
      />

      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingContact={editingContact}
        activeTab={activeTab}
      />
    </div>
  );
}
