import React from "react";
import { CheckCircle } from "lucide-react";

interface AdminHeaderProps {
  saveStatus: string | null;
}

export function AdminHeader({ saveStatus }: AdminHeaderProps) {
  return (
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
  );
}
