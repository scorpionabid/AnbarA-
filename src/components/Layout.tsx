import React from "react";
import { LayoutDashboard, Box, ScanLine, ShoppingBag, LogOut, User, Users, Wallet, BarChart3 } from "lucide-react";
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
  const menuItems = [
    { id: "dashboard", label: "Panel", icon: LayoutDashboard },
    { id: "inventory", label: "Anbar", icon: Box },
    { id: "contacts", label: "Əlaqələr", icon: Users },
    { id: "debts", label: "Nisyələr", icon: Wallet },
    { id: "reports", label: "Hesabatlar", icon: BarChart3 },
    { id: "marketplace", label: "Satış", icon: ShoppingBag },
  ];

  if (user.role === "super_admin") {
    menuItems.push({ id: "markets", label: "Mağazalar", icon: ShoppingBag });
  }

  if (user.role === "super_admin" || user.role === "store_admin") {
    menuItems.push({ id: "admin", label: "Admin", icon: User });
  }

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">AnbarAİ</h1>
          <p className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Azerbaijan Market</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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

        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 rounded-xl mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
              <User className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{user.displayName}</p>
              <p className="text-xs text-zinc-400 truncate capitalize">{user.role.replace("_", " ")}</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Çıxış
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
