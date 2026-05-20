import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

function fmtMoney(v) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-600 truncate max-w-[120px]">{p.dataKey}</span>
          <span className="font-mono font-medium text-slate-800 ml-auto pl-2">
            {fmtMoney(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MonthlyTrendChart({ data, groupings }) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-700">Monthly Net Collected by Payer</h2>
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-slate-700">Monthly Net Collected by Payer</h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tickFormatter={fmtMoney}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#64748b' }}
            iconType="circle"
            iconSize={8}
          />
          {groupings.map((g, i) => (
            <Line
              key={g}
              type="monotone"
              dataKey={g}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
