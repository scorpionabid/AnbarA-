import React from "react";
import { Loader2 } from "lucide-react";
import { useAuditLogs } from "../../hooks/useAuditLogs";

export function AuditLogView() {
  const { logs, loading } = useAuditLogs();

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden overflow-x-auto">
      <table className="w-full text-left whitespace-nowrap min-w-[600px]">
        <thead className="bg-zinc-50 border-b border-zinc-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Admin</th>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Fəaliyyət</th>
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Tarix</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-zinc-50">
              <td className="px-6 py-4 text-sm font-medium text-zinc-900">{log.adminId}</td>
              <td className="px-6 py-4 text-sm text-zinc-600">{log.action}</td>
              <td className="px-6 py-4 text-sm text-zinc-500">
                {log.timestamp?.toDate().toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
