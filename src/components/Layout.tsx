import React, { useState } from "react";
import { LayoutDashboard, Box, ScanLine, ShoppingBag, LogOut, User, Users, Wallet, BarChart3, ShoppingCart, Repeat, Receipt, RotateCcw, Landmark, Truck, AlertTriangle, Menu, X } from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { cn } from "../lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, user, activeTab, setActiveTab }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Panel", icon: LayoutDashboard },
    { id: "pos", label: "Satış (POS)", icon: ScanLine },
    { id: "inventory_hub", label: "Anbar İdarəetməsi", icon: Box },
    { id: "transactions", label: "Əməliyyatlar", icon: Repeat },
    { id: "finance_hub", label: "Maliyyə", icon: Landmark },
    { id: "contacts", label: "Əlaqələr", icon: Users },
    { id: "reports", label: "Hesabatlar", icon: BarChart3 },
  ];

  if (user.role === "super_admin") {
    menuItems.push({ id: "markets", label: "Mağazalar", icon: ShoppingBag });
  }

  if (user.role === "super_admin" || user.role === "store_admin") {
    menuItems.push({ id: "admin", label: "Admin", icon: User });
  }

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">AnbarAİ</h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -mr-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-zinc-200 flex flex-col z-40 transition-transform duration-300 ease-in-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">AnbarAİ</h1>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Azerbaijan Market</p>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 -mr-2 text-zinc-400 hover:bg-zinc-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                closeSidebar();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                activeTab === item.id
                  ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100 mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 rounded-xl mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{user.displayName}</p>
              <p className="text-xs text-zinc-400 truncate capitalize">{user.role.replace("_", " ")}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                await signOut(auth);
              } catch (error) {
                console.error("Sign out error:", error);
              }
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Çıxış
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0">
        <div className="p-4 sm:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
