import React from "react";
import { Key, Settings, Save, Database } from "lucide-react";

interface SystemSettingsProps {
  type: "ai" | "settings";
  apiKeys: any;
  setApiKeys: (keys: any) => void;
  appSettings: any;
  setAppSettings: (settings: any) => void;
  onSave: () => void;
  onSeedDatabase?: () => void;
}

export function SystemSettings({
  type,
  apiKeys,
  setApiKeys,
  appSettings,
  setAppSettings,
  onSave,
  onSeedDatabase
}: SystemSettingsProps) {
  const isAI = type === "ai";

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            {isAI ? <Key className="w-5 h-5 text-zinc-400" /> : <Settings className="w-5 h-5 text-zinc-400" />}
            {isAI ? "Aİ API Açar İdarəetməsi" : "Ümumi Tətbiq Ayarları"}
          </h3>
          <p className="text-zinc-500 text-sm mt-1">
            {isAI ? "Gemini və digər LLM modelləri üçün açarlar." : "Sistem parametrləri və lokallaşdırma."}
          </p>
        </div>
        <button
          onClick={onSave}
          className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <Save className="w-4 h-4" />
          Yadda Saxla
        </button>
      </div>

      <div className="max-w-xl space-y-6">
        {isAI ? (
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Google Gemini API Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiKeys.gemini}
                onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
              />
            </div>
            <p className="text-[10px] text-zinc-400 italic">Bu açar OCR və Stok təhlili üçün istifadə olunur.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">Şirkət Adı</label>
              <input
                value={appSettings.companyName}
                onChange={(e) => setAppSettings({ ...appSettings, companyName: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">ƏDV Dərəcəsi (%)</label>
              <input
                type="number"
                value={appSettings.vatRate}
                onChange={(e) => setAppSettings({ ...appSettings, vatRate: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>
          
          {onSeedDatabase && (
            <div className="pt-8 mt-8 border-t border-zinc-100">
              <h4 className="text-sm font-bold mb-2">Demo Məlumatlar</h4>
              <p className="text-sm text-zinc-500 mb-4">
                Sistemi test etmək üçün API-lər vasitəsilə (DummyJSON) avtomatik olaraq kateqoriyalar, məhsullar və müştərilər əlavə edin.
              </p>
              <button
                onClick={onSeedDatabase}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-100 transition-colors font-medium text-sm"
              >
                <Database className="w-4 h-4" />
                Demo Məlumatları Yüklə
              </button>
            </div>
          )}
        </>
        )}
      </div>
    </div>
  );
}
