/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./lib/firestoreUtils";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Inventory } from "./components/Inventory";
import { Sales } from "./components/Sales";
import { Transactions } from "./components/Transactions";
import { AdminPanel } from "./components/AdminPanel";
import { Markets } from "./components/Markets";
import { Contacts } from "./components/Contacts";
import { FinanceHub } from "./components/FinanceHub";
import { InventoryHub } from "./components/InventoryHub";
import { Reports } from "./components/Reports";
import { LogIn, Loader2 } from "lucide-react";

import { Toaster } from "sonner";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loginError, setLoginError] = useState<string | null>(null);

const SUPER_ADMIN_EMAIL = "scorpionabid82@gmail.com";

  useEffect(() => {
    const fetchUser = async (user: any) => {
      const userEmail = user.email || "";
      try {
        const userDocRef = doc(db, "users", userEmail);
        const oldUserDocRef = doc(db, "users", user.uid);
        
        let userDoc;
        let userData;
        try {
          userDoc = await getDoc(userDocRef);
        } catch (e: any) {
          if (e.message?.includes("Quota") || e.code === "resource-exhausted") {
             console.warn("Firestore Quota exceeded, bypassing login with cached/local fallback:", e);
             // Fallback for quota limits to allow user into the app
             userData = {
               uid: userEmail,
               email: userEmail,
               displayName: user.displayName || "",
               role: user.email === SUPER_ADMIN_EMAIL ? "super_admin" : "sales_agent",
               createdAt: new Date().toISOString(),
             };
             setUser(userData);
             setLoginError(null);
             return;
          }
          throw e; // Rethrow if it's another error
        }

        if (!userDoc.exists()) {
          // Check if old UID-based document exists
          const oldUserDoc = await getDoc(oldUserDocRef);
          if (oldUserDoc.exists()) {
            userData = oldUserDoc.data();
            userData.uid = userEmail; // Keep consistency
            await setDoc(userDocRef, userData);
            try {
              await deleteDoc(oldUserDocRef);
            } catch (e) {
              console.warn("Could not delete old user document", e);
            }
          } else {
            // New user creation
            userData = {
              uid: userEmail,
              email: userEmail,
              displayName: user.displayName || "",
              role: user.email === SUPER_ADMIN_EMAIL ? "super_admin" : "sales_agent",
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, userData);
          }
        } else {
          userData = userDoc.data();
        }

        // Sync role for super admin
        if (user.email === SUPER_ADMIN_EMAIL && userData.role !== "super_admin") {
          userData = { ...userData, role: "super_admin" };
          await setDoc(userDocRef, userData, { merge: true });
        }

        setUser(userData);
        setLoginError(null);
      } catch (error: any) {
        console.error("Auth state change error:", error);
        const friendlyError = handleFirestoreError(error, OperationType.GET, "users/" + userEmail);
        setLoginError(`Sistemə giriş zamanı xəta baş verdi: ${friendlyError}`);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        fetchUser(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
      // Don't show an error if the user just closed the popup
      if (error instanceof Error && !error.message.includes('auth/popup-closed-by-user')) {
        setLoginError("Sistemə giriş zamanı xəta baş verdi.");
      }
    }
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
          
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {loginError}
            </div>
          )}

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
      <Toaster position="top-right" richColors />
      {activeTab === "dashboard" && <Dashboard user={user} />}
      {activeTab === "pos" && <Sales user={user} />}
      {activeTab === "inventory_hub" && <InventoryHub user={user} />}
      {activeTab === "transactions" && <Transactions user={user} />}
      {activeTab === "contacts" && <Contacts user={user} />}
      {activeTab === "finance_hub" && <FinanceHub user={user} />}
      {activeTab === "reports" && <Reports user={user} />}
      {activeTab === "markets" && user.role === "super_admin" && <Markets user={user} />}
      {activeTab === "admin" && (user.role === "super_admin" || user.role === "store_admin") && <AdminPanel user={user} />}
    </Layout>
  );
}

