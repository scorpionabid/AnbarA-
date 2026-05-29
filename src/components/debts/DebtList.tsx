import React from "react";
import { cn } from "../../lib/utils";

interface DebtListProps {
  clients: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedClient: any;
  onSelectClient: (client: any) => void;
  loading: boolean;
}

export function DebtList({ clients, searchQuery, setSearchQuery, selectedClient, onSelectClient, loading }: DebtListProps) {
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-[500px] lg:min-h-0">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Nisyə İdarəetməsi</h2>
        <p className="text-zinc-500 mt-1">Müştəri borcları və ödəniş tarixçəsi.</p>
      </header>

      <div className="relative">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Müştəri axtar..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className={cn(
                  "flex flex-col p-6 rounded-3xl border transition-all text-left group",
                  selectedClient?.id === client.id 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-xl" 
                  : "bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-sm"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                    selectedClient?.id === client.id ? "bg-white/10" : "bg-zinc-100 text-zinc-900"
                  )}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded-lg",
                    selectedClient?.id === client.id ? "bg-white/20 text-white" : "bg-red-50 text-red-600"
                  )}>
                    Borc
                  </span>
                </div>
                <h4 className="font-bold text-lg mb-1">{client.name}</h4>
                <p className={cn(
                  "text-xs mb-4",
                  selectedClient?.id === client.id ? "text-zinc-400" : "text-zinc-500"
                )}>
                  {client.phone || "Telefon yoxdur"}
                </p>
                <div className="mt-auto pt-4 border-t border-current opacity-20 flex justify-between items-end">
                  <span className="text-sm font-medium">Cəmi Borc:</span>
                  <span className="text-2xl font-black">₼{client.debt}</span>
                </div>
              </button>
            ))}
            {filteredClients.length === 0 && (
              <div className="col-span-full p-12 text-center text-zinc-500 bg-white border border-zinc-200 rounded-3xl">
                Borcu olan müştəri tapılmadı.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
