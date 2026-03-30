import React from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryChartProps {
  data: any[];
  colors: string[];
}

export function CategoryChart({ data, colors }: CategoryChartProps) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-100 hover:shadow-sm transition-all">
      <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
        <PieChartIcon className="w-5 h-5" />
        Kateqoriya Payı
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 space-y-3">
        {data.slice(0, 4).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-sm font-medium text-zinc-600">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-zinc-900">₼{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
