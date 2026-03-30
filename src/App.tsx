/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Inventory } from "./components/Inventory";
import { Sales } from "./components/Sales";
import { AdminPanel } from "./components/AdminPanel";
import { Markets } from "./components/Markets";
import { Contacts } from "./components/Contacts";
import { Debts } from "./components/Debts";
import { Reports } from "./components/Reports";
import { LogIn, Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          const newUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: user.email === "scorpionabid82@gmail.com" ? "super_admin" : "customer",
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, "users", user.uid), newUser);
          setUser(newUser);
        } else {
          const data = userDoc.data();
          if (user.email === "scorpionabid82@gmail.com" && data.role !== "super_admin") {
            const updatedUser = { ...data, role: "super_admin" };
            await setDoc(doc(db, "users", user.uid), updatedUser, { merge: true });
            setUser(updatedUser);
          } else {
            setUser(data);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-zinc-100 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">AnbarAİ</h1>
          <p className="text-zinc-500 mb-8">Professional Stock Management & Marketplace</p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Google ilə daxil ol
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "dashboard" && <Dashboard user={user} />}
      {activeTab === "inventory" && <Inventory user={user} />}
      {activeTab === "marketplace" && <Sales user={user} />}
      {activeTab === "contacts" && <Contacts user={user} />}
      {activeTab === "debts" && <Debts user={user} />}
      {activeTab === "reports" && <Reports user={user} />}
      {activeTab === "markets" && user.role === "super_admin" && <Markets user={user} />}
      {activeTab === "admin" && (user.role === "super_admin" || user.role === "store_admin") && <AdminPanel user={user} />}
    </Layout>
  );
}

