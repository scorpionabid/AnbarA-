import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where, serverTimestamp } from "firebase/firestore";
import { Plus, Search, Edit2, Trash2, Loader2, X, Users, Truck, Phone, Mail, MapPin, FileText } from "lucide-react";
import { cn } from "../lib/utils";

export function Contacts({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"client" | "supplier">("client");
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    type: "client" as "client" | "supplier",
    storeId: user.storeId || "",
  });

  const canManage = user.role === "super_admin" || user.role === "store_admin" || user.role === "sales_agent";

  useEffect(() => {
    fetchContacts();
  }, [activeTab]);

  const fetchContacts = async () => {
    setLoading(true);
    let q = query(collection(db, "contacts"), where("type", "==", activeTab));
    if (user.role !== "super_admin") {
      q = query(q, where("storeId", "==", user.storeId));
    }
    const snap = await getDocs(q);
    setContacts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact) {
      await updateDoc(doc(db, "contacts", editingContact.id), formData);
    } else {
      await addDoc(collection(db, "contacts"), {
        ...formData,
        type: activeTab,
        createdAt: serverTimestamp(),
      });
    }
    setIsModalOpen(false);
    setEditingContact(null);
    fetchContacts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Əlaqələr</h2>
          <p className="text-zinc-500">Müştərilər və təchizatçıların idarə edilməsi.</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setFormData({ name: "", email: "", phone: "", address: "", taxId: "", type: activeTab, storeId: user.storeId || "" });
              setEditingContact(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni {activeTab === "client" ? "Müştəri" : "Təchizatçı"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("client")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "client" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <Users className="w-4 h-4" />
          Müştərilər
        </button>
        <button
          onClick={() => setActiveTab("supplier")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "supplier" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <Truck className="w-4 h-4" />
          Təchizatçılar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-zinc-400" /></div>
      ) : (
        <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:shadow-sm transition-all">
          <table className="w-full text-left">
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
                          onClick={() => {
                            setEditingContact(contact);
                            setFormData(contact);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("Silmək istədiyinizə əminsiniz?")) {
                              await deleteDoc(doc(db, "contacts", contact.id));
                              fetchContacts();
                            }
                          }}
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
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative mt-auto sm:my-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold mb-6">
              {editingContact ? "Redaktə Et" : `Yeni ${activeTab === "client" ? "Müştəri" : "Təchizatçı"}`}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
      )}
    </div>
  );
}
