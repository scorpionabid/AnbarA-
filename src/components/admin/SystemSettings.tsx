import React, { useState } from "react";
import { Key, Settings, Save, Database, Store as StoreIcon, Copy, RefreshCw, Check } from "lucide-react";

interface SystemSettingsProps {
  type: "ai" | "settings";
  apiKeys: any;
  setApiKeys: (keys: any) => void;
  appSettings: any;
  setAppSettings: (settings: any) => void;
  onSave: () => void;
  onSeedDatabase?: () => void;
  stores?: any[];
  onGenerateApiKey?: (storeId: string) => void;
  onUpdateStoreWebhook?: (storeId: string, url: string) => void;
}

export function SystemSettings({
  type,
  apiKeys,
  setApiKeys,
  appSettings,
  setAppSettings,
  onSave,
  onSeedDatabase,
  stores = [],
  onGenerateApiKey,
  onUpdateStoreWebhook
}: SystemSettingsProps) {
  const isAI = type === "ai";
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [webhookUrls, setWebhookUrls] = useState<Record<string, string>>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

      <div className="max-w-2xl space-y-6">
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
          
          <div className="pt-8 mt-8 border-t border-zinc-100">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-500" />
              Mağazaların API Açarları
            </h4>
            <div className="space-y-3">
              {stores.length > 0 ? stores.map(store => (
                <div key={store.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-zinc-100 shadow-sm shrink-0">
                        <StoreIcon className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-zinc-900">{store.name}</p>
                          <span className="text-[10px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded font-mono" title="Mağaza ID">ID: {store.id}</span>
                          <button onClick={() => copyToClipboard(store.id, `id_${store.id}`)} className="text-zinc-400 hover:text-zinc-600 transition-colors" title="ID Kopyala">
                            {copiedId === `id_${store.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        {store.apiKey ? (
                           <div className="flex flex-col gap-2 mt-2">
                             <div className="flex items-center gap-2">
                               <span className="text-xs font-mono text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded">
                                 {store.apiKey.slice(0, 10)}••••••••••••
                               </span>
                               <button 
                                 onClick={() => copyToClipboard(store.apiKey, store.id)}
                                 className="text-zinc-400 hover:text-zinc-600 transition-colors"
                                 title="Açarı Kopyala"
                               >
                                 {copiedId === store.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                               </button>
                             </div>
                             <div className="text-[10px] text-zinc-500 flex flex-col gap-1.5 mt-1 border border-zinc-200 bg-white p-2 rounded-md">
                               <span className="font-mono text-zinc-600">GET {window.location.origin}/api/v1/store/{store.id}/products</span>
                               <span className="font-mono text-zinc-600">POST {window.location.origin}/api/v1/store/{store.id}/webhook/trigger</span>
                             </div>
                           </div>
                        ) : (
                           <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded mt-1 inline-block">
                             Açar Yoxdur
                           </span>
                        )}
                        
                        <div className="mt-4 pt-4 border-t border-zinc-200 flex items-center gap-2 max-w-sm">
                          <input 
                              type="url" 
                              placeholder="https://sizin-saytiniz.com/webhook" 
                              value={webhookUrls[store.id] !== undefined ? webhookUrls[store.id] : (store.webhookUrl || "")}
                              onChange={(e) => setWebhookUrls(prev => ({ ...prev, [store.id]: e.target.value }))}
                              className="text-xs flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400"
                          />
                          {onUpdateStoreWebhook && (
                            <button
                              onClick={() => {
                                const url = webhookUrls[store.id] !== undefined ? webhookUrls[store.id] : (store.webhookUrl || "");
                                onUpdateStoreWebhook(store.id, url);
                              }}
                              className="bg-black text-white text-xs px-3 py-2 rounded-lg hover:bg-zinc-800 transition whitespace-nowrap"
                            >
                              Webhook Yenilə
                            </button>
                          )}
                        </div>
                        
                      </div>
                    </div>
                    {onGenerateApiKey && (
                      <button 
                        onClick={() => onGenerateApiKey(store.id)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {store.apiKey ? "Yenilə" : "Yarat"}
                      </button>
                    )}
                  </div>
              )) : (
                <p className="text-sm text-zinc-500 italic">Heç bir mağaza tapılmadı.</p>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
              Bu API açarlarından istifadə etməklə üçüncü tərəf tətbiqlərdən (məsələn, e-ticarət saytınız) 
              mağazanızın məhsullarını və kateqoriyalarını çəkə bilərsiniz. 
              Məsələn: <code className="bg-zinc-100 px-1 py-0.5 rounded">GET {window.location.origin}/api/v1/store/&#123;store_id&#125;/products?apiKey=sk_live_...</code>
            </p>
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
