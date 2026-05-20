import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function fmtMoney(v) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.fill }} />
          <span className="text-slate-600">{p.name}</span>
          <span className="font-mono font-medium text-slate-800 ml-auto pl-2">{fmtMoney(p.value)}</span>
          <span className="text-slate-400">({total > 0 ? ((p.value / total) * 100).toFixed(1) : 0}%)</span>
        </div>
      ))}
    </div>
  );
}

export default function StateComparisonChart({ data }) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-700">Insurance vs Patient Mix by State</h2>
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-slate-700">Insurance vs Patient Mix by State</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="state"
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
          <Bar dataKey="insurancePayment" name="Insurance Payment" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="patientPayment" name="Patient Payment" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
